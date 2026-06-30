import { vi, describe, it, expect } from "vitest";

// Mock 'ai' so generate.ts can be imported without the ai package installed.
// The DI opts.generate is always injected in these tests so generateObject
// is never actually called.
vi.mock("ai", () => ({ generateObject: vi.fn() }));

import { generateVisitBrief } from "../generate";
import type { ModelChainEntry } from "../generate";
import type { VisitBrief } from "../types";

function makeChain(n = 1): ModelChainEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    provider: "google" as const,
    modelId: `fake-model-${i}`,
    model: {} as unknown as ModelChainEntry["model"],
  }));
}

function makeValidBrief(input: string): VisitBrief {
  return {
    status: "ok",
    layout: "stacked",
    sections: [
      { kind: "summary", include: true, emphasis: "primary", order: 0 },
      { kind: "concerns", include: true, emphasis: "normal", order: 1 },
      { kind: "questions", include: true, emphasis: "normal", order: 2 },
      { kind: "confidence", include: true, emphasis: "muted", order: 3 },
      { kind: "evidence", include: false, emphasis: "muted", order: 4 },
    ],
    summary: { text: "Patient presents with hypertension and reported headaches.", keyPoints: [] },
    concerns: [{ text: "Hypertension follow-up", emphasis: "primary" }],
    suggestedQuestions: [
      { text: "How long have you had headaches?", context: "Frequency matters for triage" },
    ],
    confidence: { level: "high", rationale: "Clear clinical context provided." },
    evidence: [
      {
        claim: "Hypertension noted in record",
        sourceQuote: input.slice(0, 20),
        sectionRef: "concerns",
      },
    ],
    reason: "",
  };
}

describe("generateVisitBrief", () => {
  it("(1) schema-invalid response returns status:uncertain fallback — not a throw", async () => {
    const chain = makeChain(1);
    const fakeGenerate = vi.fn().mockResolvedValue({ object: { invalid: "not a brief" } });

    const result = await generateVisitBrief("patient has hypertension", {
      chain,
      generate: fakeGenerate,
    });

    expect(result.status).toBe("uncertain");
    expect(result.sections.every((s) => !s.include)).toBe(true);
    expect(typeof result.reason).toBe("string");
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it("(2) every provider throws transient error returns fallback — not a throw", async () => {
    // Two-provider chain; both throw transient errors.
    // isTransient (from lib/model stub) returns true for messages containing '503'.
    const chain = makeChain(2);
    const fakeGenerate = vi
      .fn()
      .mockRejectedValue(new Error("503 service temporarily unavailable"));

    const result = await generateVisitBrief("patient notes", { chain, generate: fakeGenerate });

    expect(result.status).toBe("uncertain");
    expect(typeof result.reason).toBe("string");
    expect(result.reason.length).toBeGreaterThan(0);
    // generate should have been called for each provider
    expect(fakeGenerate).toHaveBeenCalledTimes(2);
  });

  it("(3) evidence item whose sourceQuote is absent from input is stripped", async () => {
    const input = "patient has hypertension and reports headaches";
    const brief = makeValidBrief(input);
    // Append an evidence item whose sourceQuote is NOT a substring of input
    brief.evidence.push({
      claim: "Diabetes mentioned",
      sourceQuote: "diabetes mellitus type 2",
      sectionRef: "evidence",
    });

    const fakeGenerate = vi.fn().mockResolvedValue({ object: brief });
    const result = await generateVisitBrief(input, { chain: makeChain(1), generate: fakeGenerate });

    expect(result.status).toBe("ok");
    // Only evidence items whose sourceQuote is in input survive
    for (const e of result.evidence) {
      expect(input.includes(e.sourceQuote)).toBe(true);
    }
    // The fabricated evidence item ("diabetes mellitus type 2") must be gone
    const diabetesItem = result.evidence.find((e) => e.sourceQuote === "diabetes mellitus type 2");
    expect(diabetesItem).toBeUndefined();
  });

  it("(4) happy path: valid brief with all-valid evidence passes through", async () => {
    const input = "patient has hypertension and headaches for two weeks";
    const brief: VisitBrief = {
      ...makeValidBrief(input),
      evidence: [
        { claim: "Hypertension", sourceQuote: "hypertension", sectionRef: "concerns" },
        { claim: "Headaches", sourceQuote: "headaches", sectionRef: "concerns" },
        { claim: "Duration", sourceQuote: "two weeks", sectionRef: "evidence" },
      ],
    };

    const fakeGenerate = vi.fn().mockResolvedValue({ object: brief });
    const result = await generateVisitBrief(input, { chain: makeChain(1), generate: fakeGenerate });

    expect(result.status).toBe("ok");
    expect(result.evidence).toHaveLength(3);
    expect(result.summary.text).toBe(brief.summary.text);
    expect(result.suggestedQuestions).toHaveLength(1);
  });
});
