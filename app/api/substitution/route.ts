import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  tool,
  type UIMessage,
} from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import {
  searchBySubstance,
  getDetail,
  searchByName,
} from "@/lib/medicinpriser";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

const apiKey = process.env.GROQ_API_KEY?.trim();
const modelId = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

const SYSTEM = `You are a Danish hospital and regional pharmacy PROCUREMENT assistant.
Your mandate is economics only — comparative pricing, reimbursement-basis exposure,
and ranked substitution analysis. You do not provide dosing, clinical, or therapeutic
advice. If Dosering or Indikation data appears in a tool result you may cite it as
factual context only, never as a recommendation.

WORKFLOW — follow this sequence exactly for every query:

1. FIND THE ANCHOR
   Call searchBySubstance with the INN/active-substance name the user provided.
   If the user gave a brand name instead, call searchByName.
   Pick the most specific match as the anchor product and note its Varenummer.

2. FETCH ANCHOR DETAIL
   Call getDetail with the anchor's Varenummer.
   Record: Navn, Varenummer, Firma, Styrke, Pakning, PrisPrEnhed, PrisPrPakning,
   AIP, TilskudBeregnesAf, and the Substitutioner array.

3. FETCH EACH SUBSTITUTE
   For every item in Substitutioner, call getDetail with Substitutioner[i].Varenummer.
   Fetch all substitutes — do not skip any.

4. FILTER DISCONTINUED
   For each substitute detail result, check Udgaaet.
   If Udgaaet === true, write exactly:
     Filtering: <Navn> marked Udgaaet — removing from ranked set.
   Remove it. Continue with the remaining substitutes only.

5. RANK BY UNIT PRICE
   Sort non-discontinued substitutes ascending by PrisPrEnhed (cheapest first).
   Substitutes where PrisPrEnhed is null rank last.
   Include the anchor at its natural position in the ranking.

6. COMPUTE REIMBURSEMENT EXPOSURE
   If any substitute has a lower AIP than the anchor's TilskudBeregnesAf, that
   gap represents potential over-reimbursement. Flag it if the delta is material
   (>5% or >10 DKK absolute).

NUMBER DISCIPLINE — CRITICAL
You MUST NOT write any raw price or reimbursement number in your output.
Every price figure — without exception — must be written as a sentinel in this
exact format:
  [PRICE:vnr:field]
where:
  - vnr  = the product's 6-digit Varenummer (string, exactly as returned by the API)
  - field = one of: PrisPrPakning | PrisPrEnhed | AIP | TilskudBeregnesAf

Example (one-shot — follow this pattern precisely):
  The cheapest substitute per unit is Metformin "Orion" at [PRICE:052847:PrisPrEnhed],
  versus [PRICE:111955:PrisPrEnhed] for the originator Glucophage.
  The reimbursement basis for the anchor is [PRICE:111955:TilskudBeregnesAf],
  compared to an AIP of [PRICE:052847:AIP] for the cheapest substitute.

Do NOT write "44.50 DKK", "kr. 12,75", "0.45", or any numeric literal anywhere in
your response. Only [PRICE:vnr:field] sentinels. The UI renders these into formatted
currency — raw numbers will break the display.

OUTPUT STRUCTURE
Produce these four sections in order:

A. FILTERED SUBSTITUTES (if any were removed)
   List each removal line verbatim as required by step 4.

B. RANKED COMPARISON TABLE
   One row per product (anchor + non-discontinued substitutes), ranked cheapest first
   by PrisPrEnhed. For each row include: rank, Navn, Firma, Styrke, Pakning,
   PrisPrEnhed sentinel, PrisPrPakning sentinel.
   Use a markdown table with headers:
   | Rank | Produkt | Firma | Styrke | Pakning | Pris/enhed | Pris/pakning |

C. SUMMARY PARAGRAPH
   One paragraph (3-5 sentences). State which product is cheapest per unit, the
   spread between cheapest and most expensive, and whether the anchor is the
   procurement-optimal choice. Use only [PRICE:vnr:field] sentinels for any figures.

D. REIMBURSEMENT EXPOSURE FLAG
   If the delta computed in step 6 is material, write a one-paragraph flag
   explaining the exposure using [PRICE:vnr:field] sentinels. If not material,
   write: "Reimbursement basis: no material exposure detected."

E. DISCLAIMER (always last)
   Clinical substitution decisions require licensed pharmacist review.

TOOL FAILURE HANDLING
If a tool returns { error: "..." }, note it briefly ("Could not fetch detail for
VNR <vnr>: <error>") and continue with the products you have. Do not halt.`;

export async function POST(req: Request) {
  if (!apiKey) {
    return Response.json(
      {
        error:
          "No GROQ_API_KEY set. Add a free key from https://console.groq.com/keys to .env.local",
      },
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

  const groq = createGroq({ apiKey });

  const result = streamText({
    model: groq(modelId),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 2500,
    temperature: 0.3,
    stopWhen: stepCountIs(12),
    tools: {
      searchBySubstance: tool({
        description:
          "Search for products by active substance (INN/virksomtstof). Returns a list of matching products with their Varenummer. Call this first when the user provides an active-substance name.",
        inputSchema: z.object({
          stof: z
            .string()
            .describe("The active substance name (INN), e.g. 'metformin'."),
        }),
        execute: async ({ stof }) => {
          const r = await searchBySubstance(stof);
          return r.ok ? r.data : { error: r.error };
        },
      }),
      getDetail: tool({
        description:
          "Fetch full product detail for a single product by its 6-digit Varenummer (VNR). Returns pricing, reimbursement basis, discontinued status, and the Substitutioner list. Call this on the anchor and on each substitute's Varenummer.",
        inputSchema: z.object({
          vnr: z
            .string()
            .describe(
              "The 6-digit product Varenummer, e.g. '052847'. Found in search results or in Substitutioner[i].Varenummer.",
            ),
        }),
        execute: async ({ vnr }) => {
          const r = await getDetail(vnr);
          return r.ok ? r.data : { error: r.error };
        },
      }),
      searchByName: tool({
        description:
          "Search for products by brand or product name (partial match). Use this when the user provides a brand name rather than an active substance.",
        inputSchema: z.object({
          navn: z
            .string()
            .describe("The product or brand name to search for, e.g. 'Glucophage'."),
        }),
        execute: async ({ navn }) => {
          const r = await searchByName(navn);
          return r.ok ? r.data : { error: r.error };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
