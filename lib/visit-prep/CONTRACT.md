# Visit Prep Assistant — Data Contract

This document is the authoritative reference for the `/visit-prep` route's
generative-UI data contract.  It is written for the implementer who will wire
`lib/visit-prep/schema.ts` into the API route and build the renderer.

---

## 1. Model chain signatures (verbatim from `lib/model.ts`)

```typescript
/**
 * Classify an error as transient (503/high-demand/429/rate-limit) — safe to
 * retry on the next provider. Auth errors (401/403/invalid key) and bad-request
 * (400) are NOT transient and must surface immediately.
 */
export function isTransient(err: unknown): boolean {
  // Unwrap wrapped error objects (e.g. { error: originalErr })
  const e =
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
    "";
  return /high demand|overloaded|temporarily|unavailable|503|tokens per (minute|day)|\bTPM\b|\bTPD\b|rate.?limit|too large|\b429\b|quota|exceeded your|resource.?exhausted|insufficient/i.test(
    msg,
  );
}
```

```typescript
/**
 * Returns an ordered array of available providers (primary first, filtered by
 * key presence). Primary is determined by AI_PROVIDER env (default "google").
 * Each entry is ready to use as a LanguageModel.
 */
export function resolveModelChain(): ModelChainEntry[] {
  const primary = (process.env.AI_PROVIDER?.trim() || "google").toLowerCase();
  const order: Array<"google" | "groq"> =
    primary === "groq" ? ["groq", "google"] : ["google", "groq"];
  return order
    .map<ModelChainEntry | null>((p) =>
      p === "groq" ? buildGroqEntry() : buildGoogleEntry(),
    )
    .filter((e): e is ModelChainEntry => e !== null);
}
```

The `ModelChainEntry` type:

```typescript
export type ModelChainEntry = {
  provider: "google" | "groq";
  modelId: string;
  model: LanguageModel;
};
```

---

## 2. Buffered Gemini→Groq fallback pattern (from `app/api/substitution/route.ts`)

The visit-prep route should use the same provider-chain + buffer pattern.
Below are the relevant lines from the substitution route, which serve as the
template for the `generateObject` call in the visit-prep route:

```typescript
// LLM CALL 1 (intent extraction) — try each provider in chain,
// fall back on transient errors
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
```

For the visit-prep `generateObject` call (which is a non-streaming object
extraction, not streaming text), the buffered synthesis fallback is not needed.
The intent-extraction pattern above is the correct template: iterate the chain,
catch transient errors, continue to the next provider, throw on non-transient
or last-provider failure.

The buffered streaming pattern (pre-text buffer + `shouldFallback` loop at
lines 245-316 of `substitution/route.ts`) applies to `streamText` calls where
text chunks arrive before error chunks.  `generateObject` surfaces errors
synchronously on rejection, so the simpler for-loop above is sufficient.

---

## 3. Visit Prep — System and User Prompt Template

These prompts are passed to `generateObject` with `schema: VisitBriefSchema`.

### System prompt

```
You are a VISIT PREPARATION ASSISTANT. Your sole purpose is to help a patient
organise their thoughts before a medical appointment. You do NOT provide:

  - Medical diagnoses of any kind
  - Clinical interpretations of test results
  - Medication recommendations or dosage adjustments
  - Treatment plans or treatment advice
  - Any statement that could be construed as medical advice

You are NOT a clinician. You are a structured organiser. Your output is a
VisitBrief — a structured preparation aid that summarises what the patient
wrote, flags items worth raising with their doctor, and suggests questions
they might consider asking. Nothing more.

EVIDENCE DISCIPLINE — CRITICAL:
Every item in the evidence array MUST have a sourceQuote that is a VERBATIM
SUBSTRING of the pasted input text. Do not paraphrase. Do not reconstruct. Copy
the exact words from the input. If you cannot find a verbatim span that supports
a claim, omit the evidence item rather than fabricating a quote.

OUTPUT DISCIPLINE:
You output exactly one JSON object conforming to the VisitBrief schema. No prose,
no explanations, no markdown. Only the JSON object.

LAYOUT SELECTION:
Choose the layout template that best fits the input density:
  - "dashboard": rich multi-section input with several clinical details
  - "focus":     one dominant concern (e.g. pre-op, single diagnosis follow-up)
  - "stacked":   moderate detail, two or three relevant sections
  - "minimal":   very sparse input or single-line input

SECTION SELECTION:
Set include: true only for sections you have meaningful content for. A section
with no supporting content should have include: false.

UNCERTAIN/FALLBACK:
If the pasted text does not contain recognisable appointment or medical context
(e.g. it is gibberish, unrelated prose, or too sparse to organise), set
status: "uncertain", set all sections to include: false, populate reason with a
helpful explanation, and return minimal safe values for all other fields.
```

### User prompt template

```
Please prepare a visit brief from the following appointment notes.

<PATIENT_INPUT>
{{patientInput}}
</PATIENT_INPUT>

Generate a VisitBrief JSON object. Remember:
1. Do not diagnose, recommend treatments, or give medical advice of any kind.
2. Every evidence.sourceQuote must be a verbatim substring of the text inside
   <PATIENT_INPUT> above — copy the exact words, do not paraphrase.
3. If the input is too sparse or unrecognisable, return status: "uncertain" with
   a helpful reason explaining what kind of content would be useful.
4. Select a layout that matches the information density.
5. Set include: false for any section you have no meaningful content for.
```

---

## 4. Finite generative-UI component contract

### Layout templates

The `layout` field selects one of four mutually exclusive visual templates.
The renderer switches on `brief.layout` — no other configuration is needed.

| Layout      | Description                                                                 |
|-------------|-----------------------------------------------------------------------------|
| `dashboard` | Side-by-side panels: summary left, concerns + questions right. Full grid.   |
| `focus`     | Single-column, concerns dominant at top. Used when one issue drives visit.  |
| `stacked`   | Single-column, balanced. Default for moderate-detail briefs.                |
| `minimal`   | Compact single card. Used for sparse or uncertain briefs.                   |

### Section kinds (finite and closed)

The `sections` array contains descriptors for exactly these five named sections.
No other section kinds exist — the component set is closed.

| Kind         | Component rendered           | When `include: true`                                |
|--------------|------------------------------|-----------------------------------------------------|
| `summary`    | `SummaryPanel`               | `brief.summary.text` + optional `keyPoints` list    |
| `concerns`   | `ConcernsList`               | `brief.concerns` array (filtered by emphasis)       |
| `evidence`   | `EvidenceList`               | `brief.evidence` array grouped by `sectionRef`      |
| `questions`  | `QuestionsList`              | `brief.suggestedQuestions` array                    |
| `confidence` | `ConfidenceBadge`            | `brief.confidence.level` + `rationale`              |

### Rendering algorithm

```
1. Filter sections to include === true.
2. Sort by section.order ascending.
3. For each section, render the matching component with data from brief.
4. Apply section.emphasis to component visual weight:
     "primary"  → prominent heading, full padding, accent border
     "normal"   → standard styling
     "muted"    → subdued heading, reduced padding, no accent
5. If brief.status === "uncertain", skip all sections and render
   the UncertainState component with brief.reason.
```

### Uncertainty component

When `brief.status === "uncertain"`, the renderer shows a single
`UncertainState` component with `brief.reason` and a prompt asking the user
to paste richer input. No other components are rendered.

### Evidence display

`EvidenceItem.sourceQuote` is displayed as a highlighted inline quotation
within the source text view (if the UI exposes one) or as a blockquote.
The runtime must call `isSourceQuoteValid(brief, inputText)` before rendering
and refuse to display evidence whose `sourceQuote` is not a substring of the
input (log a warning, hide the item).

### What the model may NOT produce

The schema enforces these constraints at parse time:

- No layout values outside `['dashboard', 'focus', 'stacked', 'minimal']`
- No section kinds outside `['summary', 'concerns', 'evidence', 'questions', 'confidence']`
- No emphasis values outside `['primary', 'normal', 'muted']`
- No confidence levels outside `['high', 'medium', 'low']`
- No diagnosis, treatment, or prognosis fields (not present in schema)
- No free-text component specs (sections are enum-keyed, not arbitrary strings)

Any payload that violates these constraints is rejected by `VisitBriefSchema.safeParse()`
before it reaches the renderer.
