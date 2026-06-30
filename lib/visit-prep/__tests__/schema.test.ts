import { describe, it, expect } from "vitest";
import { VisitBriefSchema, isSourceQuoteValid } from "../schema";
import {
  fixture1,
  fixture1InputText,
  fixture2,
  fixture2InputText,
  fixture3,
  fixture4,
  fixture4InputText,
} from "../fixtures";

// ── All fixtures parse ───────────────────────────────────────────────────────

describe("VisitBriefSchema — fixtures", () => {
  it("fixture1 (dashboard, high confidence) parses successfully", () => {
    const result = VisitBriefSchema.safeParse(fixture1);
    expect(result.success).toBe(true);
  });

  it("fixture2 (stacked, low confidence) parses successfully", () => {
    const result = VisitBriefSchema.safeParse(fixture2);
    expect(result.success).toBe(true);
  });

  it("fixture3 (uncertain/fallback) parses successfully", () => {
    const result = VisitBriefSchema.safeParse(fixture3);
    expect(result.success).toBe(true);
  });

  it("fixture4 (focus layout, surgical pre-op) parses successfully", () => {
    const result = VisitBriefSchema.safeParse(fixture4);
    expect(result.success).toBe(true);
  });

  it("fixture3 has status 'uncertain' and a non-empty reason", () => {
    const result = VisitBriefSchema.safeParse(fixture3);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("uncertain");
      expect(typeof result.data.reason).toBe("string");
      expect(result.data.reason!.length).toBeGreaterThan(0);
    }
  });

  it("fixture1 has status 'ok' and layout 'dashboard'", () => {
    const result = VisitBriefSchema.safeParse(fixture1);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("ok");
      expect(result.data.layout).toBe("dashboard");
    }
  });

  it("fixture4 has layout 'focus' (different from fixture1)", () => {
    const result = VisitBriefSchema.safeParse(fixture4);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.layout).toBe("focus");
    }
  });

  it("all layouts across fixtures are distinct (demonstrating visual variety)", () => {
    const layouts = [fixture1, fixture2, fixture3, fixture4].map((f) => f.layout);
    const unique = new Set(layouts);
    expect(unique.size).toBe(4); // dashboard, stacked, minimal, focus
  });
});

// ── Invalid payloads are rejected ────────────────────────────────────────────

describe("VisitBriefSchema — invalid payloads rejected", () => {
  it("rejects missing status field", () => {
    const { status: _status, ...withoutStatus } = fixture1;
    const result = VisitBriefSchema.safeParse(withoutStatus);
    expect(result.success).toBe(false);
  });

  it("rejects invalid status value", () => {
    const result = VisitBriefSchema.safeParse({ ...fixture1, status: "maybe" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid layout value (open-ended layout is forbidden)", () => {
    const result = VisitBriefSchema.safeParse({
      ...fixture1,
      layout: "freeform_anything",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid section emphasis value", () => {
    const result = VisitBriefSchema.safeParse({
      ...fixture1,
      sections: [
        { kind: "summary", include: true, emphasis: "loud", order: 0 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid section kind value", () => {
    const result = VisitBriefSchema.safeParse({
      ...fixture1,
      sections: [
        { kind: "diagnosis", include: true, emphasis: "normal", order: 0 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid confidence level value", () => {
    const result = VisitBriefSchema.safeParse({
      ...fixture1,
      confidence: { level: "very-high", rationale: "test" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing summary.text field", () => {
    const result = VisitBriefSchema.safeParse({
      ...fixture1,
      summary: { keyPoints: ["point"] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects evidence item missing sourceQuote", () => {
    const result = VisitBriefSchema.safeParse({
      ...fixture1,
      evidence: [{ claim: "something", sectionRef: "summary" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects evidence item with invalid sectionRef value", () => {
    const result = VisitBriefSchema.safeParse({
      ...fixture1,
      evidence: [
        { claim: "something", sourceQuote: "text", sectionRef: "diagnosis" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer order values in sections", () => {
    const result = VisitBriefSchema.safeParse({
      ...fixture1,
      sections: [
        { kind: "summary", include: true, emphasis: "normal", order: 1.5 },
      ],
    });
    expect(result.success).toBe(false);
  });
});

// ── Uncertain/fallback shape validates ───────────────────────────────────────

describe("VisitBriefSchema — uncertain/fallback shape", () => {
  it("minimal uncertain payload with reason validates", () => {
    const uncertain = {
      status: "uncertain",
      layout: "minimal",
      sections: [],
      summary: { text: "Input was not parseable as visit context." },
      concerns: [],
      suggestedQuestions: [],
      confidence: { level: "low", rationale: "No parseable input." },
      evidence: [],
      reason: "The pasted text did not contain medical or appointment content.",
    };
    const result = VisitBriefSchema.safeParse(uncertain);
    expect(result.success).toBe(true);
  });

  it("uncertain payload without reason field still validates (reason is optional)", () => {
    const uncertain = {
      status: "uncertain",
      layout: "minimal",
      sections: [],
      summary: { text: "Input was not parseable." },
      concerns: [],
      suggestedQuestions: [],
      confidence: { level: "low", rationale: "No parseable input." },
      evidence: [],
    };
    const result = VisitBriefSchema.safeParse(uncertain);
    expect(result.success).toBe(true);
  });
});

// ── isSourceQuoteValid helper ─────────────────────────────────────────────────

describe("isSourceQuoteValid", () => {
  it("returns true when all sourceQuotes are verbatim substrings of the input", () => {
    expect(isSourceQuoteValid(fixture1, fixture1InputText)).toBe(true);
  });

  it("returns true for fixture2 against its input text", () => {
    expect(isSourceQuoteValid(fixture2, fixture2InputText)).toBe(true);
  });

  it("returns true for fixture4 against its input text", () => {
    expect(isSourceQuoteValid(fixture4, fixture4InputText)).toBe(true);
  });

  it("returns true for fixture3 (empty evidence array)", () => {
    expect(isSourceQuoteValid(fixture3, "any input text")).toBe(true);
  });

  it("returns false when a sourceQuote is not a substring of the input text", () => {
    const fabricated: typeof fixture1 = {
      ...fixture1,
      evidence: [
        {
          claim: "Patient has diabetes",
          sourceQuote: "fabricated text not found in input",
          sectionRef: "summary",
        },
      ],
    };
    expect(isSourceQuoteValid(fabricated, fixture1InputText)).toBe(false);
  });

  it("returns false when even one of multiple sourceQuotes is invalid", () => {
    const partiallyBad: typeof fixture1 = {
      ...fixture1,
      evidence: [
        // valid
        { claim: "Diabetes", sourceQuote: "Recent diagnosis of Type 2 diabetes", sectionRef: "summary" },
        // invalid
        { claim: "Invented", sourceQuote: "this phrase is not in the notes", sectionRef: "concerns" },
      ],
    };
    expect(isSourceQuoteValid(partiallyBad, fixture1InputText)).toBe(false);
  });

  it("returns false when sourceQuote is valid but the wrong input text is provided", () => {
    // fixture1 quotes are not substrings of fixture2's short input
    expect(isSourceQuoteValid(fixture1, fixture2InputText)).toBe(false);
  });
});
