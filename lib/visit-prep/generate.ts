import { generateObject } from "ai";
import { resolveModelChain, isTransient } from "@/lib/model";
import type { ModelChainEntry } from "@/lib/model";
import { VisitBriefSchema } from "./schema";
import type { VisitBrief } from "./types";

export type { ModelChainEntry };

export type GenerateFn = (opts: {
  model: unknown;
  schema: typeof VisitBriefSchema;
  prompt: string;
  maxRetries?: number;
  temperature?: number;
}) => Promise<{ object: unknown }>;

export function buildFallback(reason: string): VisitBrief {
  return {
    status: "uncertain",
    layout: "minimal",
    sections: [
      { kind: "summary", include: false, emphasis: "muted", order: 0 },
      { kind: "concerns", include: false, emphasis: "muted", order: 1 },
      { kind: "evidence", include: false, emphasis: "muted", order: 2 },
      { kind: "questions", include: false, emphasis: "muted", order: 3 },
      { kind: "confidence", include: false, emphasis: "muted", order: 4 },
    ],
    summary: { text: "" },
    concerns: [],
    suggestedQuestions: [],
    confidence: { level: "low", rationale: "Fallback — see reason field." },
    evidence: [],
    reason,
  };
}

const SYSTEM_PROMPT = `You are a VISIT PREPARATION ASSISTANT for clinicians. Your sole purpose is \
to help a clinician prepare for an upcoming patient visit by organising the patient context \
provided. You do NOT provide:

  - Medical diagnoses of any kind
  - Clinical interpretations of test results
  - Medication recommendations or dosage adjustments
  - Treatment plans or treatment advice
  - Any statement that could be construed as authoritative medical judgement

You are NOT providing clinical opinions. You are a structured organiser. Your output is a \
VisitBrief — a structured preparation aid that summarises what is in the patient notes, \
surfaces concerns or red-flags worth exploring in the visit, and suggests questions the \
clinician might consider asking the patient. Nothing more.

EVIDENCE DISCIPLINE — CRITICAL:
Every item in the evidence array MUST have a sourceQuote that is a VERBATIM SUBSTRING of the \
pasted input text. Do not paraphrase. Do not reconstruct. Copy the exact words from the input. \
If you cannot find a verbatim span that supports a claim, omit the evidence item rather than \
fabricating a quote.

OUTPUT DISCIPLINE:
You output exactly one JSON object conforming to the VisitBrief schema. No prose, no \
explanations, no markdown. Only the JSON object.

LAYOUT SELECTION:
Choose the layout template that best fits the input density:
  - "dashboard": rich multi-section input with several clinical details
  - "focus":     one dominant concern (e.g. pre-op, single diagnosis follow-up)
  - "stacked":   moderate detail, two or three relevant sections
  - "minimal":   very sparse input or single-line input

SECTION SELECTION:
Set include: true only for sections you have meaningful content for. A section with no \
supporting content should have include: false.

UNCERTAIN/FALLBACK:
If the pasted text does not contain recognisable appointment or clinical context (e.g. it is \
gibberish, unrelated prose, or too sparse to organise), set status: "uncertain", set all \
sections to include: false, populate reason with a helpful explanation, and return minimal \
safe values for all other fields.`;

function buildUserPrompt(input: string): string {
  return `Please prepare a visit brief from the following patient notes.

<PATIENT_INPUT>
${input}
</PATIENT_INPUT>

Generate a VisitBrief JSON object. Remember:
1. Do not diagnose, recommend treatments, or interpret clinical findings authoritatively.
2. Every evidence.sourceQuote must be a verbatim substring of the text inside <PATIENT_INPUT> \
above — copy the exact words, do not paraphrase.
3. If the input is too sparse or unrecognisable, return status: "uncertain" with a helpful \
reason explaining what kind of content would be useful.
4. Select a layout that matches the information density.
5. Set include: false for any section you have no meaningful content for.
6. Suggest questions the clinician should consider asking the patient during the visit.`;
}

const defaultGenerate: GenerateFn = async (opts) => {
  const result = await generateObject({
    model: opts.model as Parameters<typeof generateObject>[0]["model"],
    schema: opts.schema,
    prompt: opts.prompt,
    maxRetries: opts.maxRetries,
    ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
  });
  return result;
};

export async function generateVisitBrief(
  input: string,
  opts?: { chain?: ModelChainEntry[]; generate?: GenerateFn },
): Promise<VisitBrief> {
  const chain = opts?.chain ?? resolveModelChain();
  const generate = opts?.generate ?? defaultGenerate;
  const prompt = `${SYSTEM_PROMPT}\n\n${buildUserPrompt(input)}`;

  let result: { object: unknown } | undefined;

  for (let ci = 0; ci < chain.length; ci++) {
    const entry = chain[ci];
    const isLast = ci === chain.length - 1;
    try {
      result = await generate({
        model: entry.model,
        schema: VisitBriefSchema,
        prompt,
        maxRetries: 4,
        ...(entry.provider === "groq" ? { temperature: 0.1 } : {}),
      });
      break;
    } catch (err) {
      if (!isLast && isTransient(err)) {
        continue;
      }
      return buildFallback(
        err instanceof Error ? err.message : "Unexpected provider error.",
      );
    }
  }

  if (!result) {
    return buildFallback("No AI providers were available.");
  }

  const parsed = VisitBriefSchema.safeParse(result.object);
  if (!parsed.success) {
    return buildFallback("The AI response did not match the expected format.");
  }

  const brief = { ...parsed.data };
  brief.evidence = brief.evidence.filter((e) => input.includes(e.sourceQuote));

  return brief;
}
