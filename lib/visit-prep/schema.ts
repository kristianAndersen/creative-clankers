import { z } from "zod";

// ── Primitive enums ──────────────────────────────────────────────────────────

export const SectionKindSchema = z.enum([
  "summary",
  "concerns",
  "evidence",
  "questions",
  "confidence",
]);

export const LayoutTemplateSchema = z.enum([
  "dashboard",
  "focus",
  "stacked",
  "minimal",
]);

export const EmphasisSchema = z.enum(["primary", "normal", "muted"]);

export const ConfidenceLevelSchema = z.enum(["high", "medium", "low"]);

// ── Sub-schemas ──────────────────────────────────────────────────────────────

/** Controls whether and how one named section is rendered. */
export const SectionDescriptorSchema = z.object({
  kind: SectionKindSchema.describe("Which named section this descriptor controls"),
  include: z.boolean().describe("Whether the renderer should include this section"),
  emphasis: EmphasisSchema.describe("Visual weight for this section"),
  order: z
    .number()
    .int()
    .min(0)
    .describe("Rendering order (ascending); lower numbers render first"),
});

/**
 * Per-claim evidence anchored to the pasted input text.
 * sourceQuote MUST be a verbatim substring of the input text — the renderer
 * and helper function isSourceQuoteValid() will verify this at runtime.
 */
export const EvidenceItemSchema = z.object({
  claim: z.string().describe("The assertion or observation being cited"),
  sourceQuote: z
    .string()
    .describe(
      "Verbatim substring of the pasted input text that supports this claim",
    ),
  sectionRef: SectionKindSchema.describe(
    "Which section this evidence item belongs to",
  ),
});

export const ConcernSchema = z.object({
  text: z.string().describe("Description of the concern"),
  emphasis: EmphasisSchema.describe("Visual weight for this concern"),
});

export const SuggestedQuestionSchema = z.object({
  text: z.string().describe("A question to raise with the care provider"),
  context: z
    .string()
    .optional()
    .describe("Brief explanation of why this question matters"),
});

export const ConfidenceIndicatorSchema = z.object({
  level: ConfidenceLevelSchema.describe("Overall confidence in the brief"),
  rationale: z
    .string()
    .describe("Brief explanation of what limits or supports this confidence level"),
});

export const VisitSummarySchema = z.object({
  text: z
    .string()
    .describe("One to three sentence overview of the visit context"),
  keyPoints: z
    .array(z.string())
    .optional()
    .describe("Up to 4 key points for quick scanning"),
});

// ── Top-level VisitBrief — flat fixed object, no nested unions ───────────────
//
// A flat object with a 'status' discriminator is used instead of a
// discriminated union because the AI SDK generateObject function is flaky
// on deep discriminated unions.  Application code branches on status === 'ok'.
//
// When status === 'uncertain': sections should all have include: false, arrays
// may be empty, and 'reason' MUST be populated to explain the fallback.
// When status === 'ok': all fields carry meaningful content and reason is absent.

export const VisitBriefSchema = z.object({
  status: z
    .enum(["ok", "uncertain"])
    .describe(
      "'ok' = confident brief ready to display; 'uncertain' = fallback with minimal safe payload",
    ),

  layout: LayoutTemplateSchema.describe(
    "Which visual layout template the renderer should apply",
  ),

  sections: z
    .array(SectionDescriptorSchema)
    .describe(
      "Ordered list of section descriptors; renderer renders sections with include:true in ascending order.order",
    ),

  summary: VisitSummarySchema.describe("Overview of the visit context"),

  concerns: z
    .array(ConcernSchema)
    .describe("Notable concerns flagged for this visit"),

  suggestedQuestions: z
    .array(SuggestedQuestionSchema)
    .describe("Recommended questions to raise with the care provider"),

  confidence: ConfidenceIndicatorSchema.describe(
    "Confidence metadata for the overall brief",
  ),

  evidence: z
    .array(EvidenceItemSchema)
    .describe(
      "Per-claim evidence anchored to verbatim spans of the pasted input",
    ),

  reason: z
    .string()
    .optional()
    .describe(
      "Populated when status='uncertain': explains why a full brief could not be produced",
    ),
});

// ── Runtime evidence validator ────────────────────────────────────────────────

/**
 * Verifies that every evidence.sourceQuote is a verbatim substring of inputText.
 * Returns true when all quotes are valid (or evidence array is empty).
 * The LLM prompt instructs that sourceQuote must be a verbatim substring — this
 * function is the runtime check at the API layer before the brief reaches the UI.
 */
export function isSourceQuoteValid(
  brief: z.infer<typeof VisitBriefSchema>,
  inputText: string,
): boolean {
  return brief.evidence.every((e) => inputText.includes(e.sourceQuote));
}
