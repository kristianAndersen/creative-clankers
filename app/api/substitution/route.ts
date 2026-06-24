import {
  streamText,
  generateObject,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { z } from "zod";
import { resolveModel, resolveModelChain, isTransient } from "@/lib/model";
import {
  searchBySubstance,
  getDetail,
  searchByName,
} from "@/lib/medicinpriser";
import type { MedicinpriserClient } from "@/lib/substitution";
import { assembleBriefing } from "@/lib/substitution";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

const intentSchema = z.object({
  substance: z
    .string()
    .optional()
    .describe('INN / active substance name (e.g. "metformin")'),
  brandName: z
    .string()
    .optional()
    .describe('Brand or product name (e.g. "Glucophage")'),
  strength: z
    .string()
    .optional()
    .describe('Strength specification (e.g. "500 mg")'),
});

const SYNTHESIS_SYSTEM = `You are a Danish hospital and regional pharmacy PROCUREMENT assistant.
Your mandate is economics only — comparative pricing, reimbursement-basis exposure,
and ranked substitution analysis. You do not provide dosing, clinical, or therapeutic
advice.

You are given pre-assembled briefing data as JSON in the prompt. Use it directly —
do not call any tools, do not invent products or prices.

NUMBER DISCIPLINE — CRITICAL
You MUST NOT write any raw price or reimbursement number in your output.
Every price figure — without exception — must be written as a sentinel in this
exact format:
  [PRICE:vnr:field]
where:
  - vnr  = the product's Varenummer (string, exactly as in the briefing data)
  - field = one of: PrisPrPakning | PrisPrEnhed | AIP | TilskudBeregnesAf

Example (one-shot — use only VNRs present in the briefing data):
  The cheapest substitute per unit is Metformin "Orion" at [PRICE:052847:PrisPrEnhed],
  versus [PRICE:111955:PrisPrEnhed] for the originator Glucophage.

Do NOT write "44.50 DKK", "kr. 12,75", "0.45", or any numeric literal anywhere in
your response. Only [PRICE:vnr:field] sentinels. The UI renders these into formatted
currency — raw numbers will break the display.

DO NOT WRITE MARKDOWN TABLES. The ranked comparison table is rendered separately by
the UI from structured data — you must not output any markdown table (no | Rank | ...
rows). Writing a table will duplicate data and corrupt the display.

OUTPUT STRUCTURE
Produce these sections in order, using ## for section headings:

## Filtered Substitutes
(Only if removed[] is non-empty.) For each item in the briefing's "removed" array,
write exactly: Filtering: <Navn> marked Udgaaet — removing from ranked set.
Omit this section entirely if removed is empty.

## Summary
One paragraph (3-5 sentences). State which product is cheapest per unit, the spread
between cheapest and most expensive, and whether the anchor is the procurement-optimal
choice. Use only [PRICE:vnr:field] sentinels for any figures.

## Reimbursement
If deltaPct in the briefing is non-null and the absolute value is greater than 5,
write a one-paragraph flag explaining the exposure using [PRICE:vnr:field] sentinels.
Otherwise write: Reimbursement basis: no material exposure detected.

## Disclaimer
Clinical substitution decisions require licensed pharmacist review.`;

const defaultClient: MedicinpriserClient = {
  searchBySubstance,
  getDetail,
  searchByName,
};

function extractQuery(messages: UIMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last) return "";
  for (const p of (last.parts ?? []) as { type?: string; text?: string }[]) {
    if (p.type === "text" && p.text) return p.text;
  }
  return "";
}

// Map any provider error to a UI-friendly, prefixed message. Shared by the
// createUIMessageStream onError AND the merged synthesis stream's onError so a
// transient "high demand" / rate-limit surfaces clearly instead of the SDK's
// default masked "An error occurred."
function friendlyError(err: unknown): string {
  const e: unknown =
    err && typeof err === "object" && "error" in err
      ? (err as { error: unknown }).error
      : err;
  const anyE = e as {
    message?: string;
    responseBody?: string;
    name?: string;
  } | null;
  const msg =
    anyE?.message ||
    anyE?.responseBody ||
    (typeof e === "string" ? e : "") ||
    anyE?.name ||
    "unknown error";
  if (/high demand|overloaded|temporarily|503|unavailable/i.test(msg)) {
    return "RATE_LIMIT: The model is temporarily overloaded (free-tier high demand). Wait a few seconds and try again.";
  }
  if (/tokens per (minute|day)|\bTPM\b|\bTPD\b|rate.?limit|too large|\b429\b|quota|exceeded your|resource.?exhausted|insufficient/i.test(msg)) {
    return "RATE_LIMIT: Free-tier quota/rate limit reached on all providers. Wait a bit, or switch provider via AI_PROVIDER.";
  }
  return `Substitution agent error: ${msg}`;
}

export async function POST(req: Request) {
  const chain = resolveModelChain();

  if (chain.length === 0) {
    const { keyHint } = resolveModel();
    return Response.json(
      { error: `NO_KEY: Missing ${keyHint}. Add it to .env.local.` },
      { status: 500 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return Response.json(
      { error: `Rate limit reached. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const body = await req.json();
  const messages: UIMessage[] = body.messages ?? [];
  const query = extractQuery(messages);

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const writeData = (type: string, data: unknown) =>
        (writer.write as (p: unknown) => void)({ type, data });

      // LLM CALL 1: extract intent from query — try each provider in chain,
      // fall back on transient errors, then use the clean-query fallback.
      let intent: { substance?: string; brandName?: string; strength?: string } =
        { substance: query, brandName: query };
      try {
        let intentResult: { object: typeof intent } | null = null;

        for (let ci = 0; ci < chain.length; ci++) {
          const entry = chain[ci];
          const isLast = ci === chain.length - 1;
          try {
            intentResult = await generateObject({
              model: entry.model,
              schema: intentSchema,
              prompt: `Extract the drug search intent from this pharmacy query: "${query}"`,
              maxOutputTokens: 200,
              maxRetries: 4,
              ...(entry.provider === "groq" ? { temperature: 0.1 } : {}),
            });
            break; // success — stop trying other providers
          } catch (err) {
            if (!isLast && isTransient(err)) {
              continue; // transient + not last: try next provider
            }
            throw err; // non-transient or last provider: surface to outer catch
          }
        }

        if (intentResult) {
          intent = intentResult.object;
        }
      } catch {
        // Intent extraction failed — derive a clean search term from the raw
        // query (strip strengths/units and intent words) so the deterministic
        // search still has a chance, rather than searching the whole sentence.
        const cleaned = query
          .replace(/\b\d+([.,]\d+)?\s*(mg|ml|mcg|g|µg|mikrogram)\b/gi, " ")
          .replace(
            /\b(substitution|substitut\w*|analysis|analyse|cheaper|billig\w*|price|pris|alternativ\w*|tablet\w*|kapsler?|for|the|of)\b/gi,
            " ",
          )
          .trim();
        const firstTerm = cleaned.split(/\s+/).filter(Boolean)[0] || query;
        intent = { substance: firstTerm, brandName: firstTerm };
      }

      // CODE: deterministic assembly
      const briefing = await assembleBriefing(intent, defaultClient, (dir, text) => {
        writeData("data-step", { dir, text });
      });

      if (!briefing.ok) {
        throw new Error(
          `Could not find products for "${query}". Try a different drug name or active substance.`,
        );
      }

      // Emit price map for UI chip locking — before synthesis so chips lock
      // regardless of which provider synthesizes.
      writeData("data-prices", briefing.data.priceMap);

      // Emit ranked rows in deterministic order for the UI table.
      // The UI renders this as an HTML table; the LLM no longer writes section B.
      writeData(
        "data-ranked",
        briefing.data.ranked.map((r) => ({
          vnr: r.Varenummer,
          Navn: r.Navn,
          Firma: r.Firma,
          Styrke: r.Styrke,
          Pakning: r.Pakning,
        })),
      );

      // LLM CALL 2: streaming synthesis — try each provider in chain.
      // Strategy: consume toUIMessageStream() chunk by chunk; buffer pre-text
      // chunks until first text-delta (safe to commit to this provider); if an
      // error chunk arrives before any text-delta and the error is transient,
      // discard the buffer and retry on the next provider.
      const synthesisPrompt = `Assembled briefing data:\n${JSON.stringify(briefing.data)}\n\nWrite the pharmaceutical procurement memo.`;

      let synthLastError: unknown;
      let synthDone = false;

      for (let ci = 0; ci < chain.length && !synthDone; ci++) {
        const entry = chain[ci];
        const isLast = ci === chain.length - 1;

        const result = streamText({
          model: entry.model,
          system: SYNTHESIS_SYSTEM,
          prompt: synthesisPrompt,
          maxOutputTokens: 1200,
          maxRetries: 4,
          ...(entry.provider === "groq" ? { temperature: 0.3 } : {}),
        });

        let textStarted = false;
        // Buffer chunks that arrive before the first text-delta so we can
        // discard them cleanly if a pre-text error forces a provider switch.
        const preTextBuffer: UIMessageChunk[] = [];
        let capturedError: unknown;
        let shouldFallback = false;

        for await (const chunk of result.toUIMessageStream({
          onError: (err) => {
            capturedError = err;
            return friendlyError(err);
          },
        })) {
          const chunkType = (chunk as { type: string }).type;

          if (chunkType === "error") {
            // Error before any text — check if we can fall back.
            if (!textStarted && !isLast && isTransient(capturedError)) {
              synthLastError = capturedError;
              shouldFallback = true;
              break;
            }
            // Non-recoverable: flush buffer then emit error chunk.
            for (const b of preTextBuffer) {
              (writer.write as (c: unknown) => void)(b);
            }
            (writer.write as (c: unknown) => void)(chunk);
            synthDone = true;
            break;
          }

          if (!textStarted) {
            if (chunkType === "text-delta") {
              textStarted = true;
              // Provider is producing text — commit buffered chunks first.
              for (const b of preTextBuffer) {
                (writer.write as (c: unknown) => void)(b);
              }
              preTextBuffer.length = 0;
              (writer.write as (c: unknown) => void)(chunk);
            } else {
              preTextBuffer.push(chunk as UIMessageChunk);
            }
          } else {
            (writer.write as (c: unknown) => void)(chunk);
          }
        }

        if (shouldFallback) continue;

        if (!synthDone) {
          // Normal completion — flush any remaining pre-text buffer (e.g.
          // start/finish chunks on an empty response) and mark done.
          for (const b of preTextBuffer) {
            (writer.write as (c: unknown) => void)(b);
          }
          synthDone = true;
        }
      }

      // All providers exhausted with transient errors — surface final error.
      if (!synthDone) {
        (writer.write as (c: unknown) => void)({
          type: "error",
          errorText: friendlyError(synthLastError),
        });
      }
    },
    onError: friendlyError,
  });

  return createUIMessageStreamResponse({
    stream: stream as unknown as ReadableStream<UIMessageChunk>,
  });
}
