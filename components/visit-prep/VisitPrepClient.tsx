"use client";
import { useState } from "react";
import type { VisitBrief } from "@/lib/visit-prep/types";
import {
  fixture1,
  fixture1InputText,
  fixture2,
  fixture2InputText,
  fixture3,
  fixture4,
  fixture4InputText,
} from "@/lib/visit-prep/fixtures";
import { SAMPLE_NOTES } from "@/lib/visit-prep/sample-notes";
import { VisitBriefRenderer } from "./VisitBriefRenderer";
import { Disclaimer } from "./Disclaimer";
import { DebugPanel } from "./DebugPanel";

// [fixture, inputText] pairs — fixture3 is uncertain, no sourceQuotes to validate
const FIXTURES: [VisitBrief, string][] = [
  [fixture1, fixture1InputText],
  [fixture2, fixture2InputText],
  [fixture3, ""],
  [fixture4, fixture4InputText],
];

const FIXTURE_LABELS = [
  "Fixture 1 · Dashboard",
  "Fixture 2 · Stacked (sparse)",
  "Fixture 3 · Uncertain",
  "Fixture 4 · Focus (pre-op)",
];

function sanitizeBrief(brief: VisitBrief, inputText: string): VisitBrief {
  if (brief.status === "uncertain" || !inputText) return brief;
  const validEvidence = brief.evidence.filter((item) => {
    const valid = inputText.includes(item.sourceQuote);
    if (!valid) {
      console.warn(`[visit-prep] hiding evidence with unverifiable sourceQuote: "${item.sourceQuote}"`);
    }
    return valid;
  });
  if (validEvidence.length === brief.evidence.length) return brief;
  return { ...brief, evidence: validEvidence };
}

type ActionState = "idle" | "approved" | "editing";

export function VisitPrepClient() {
  const [note, setNote] = useState<string>("");
  const [brief, setBrief] = useState<VisitBrief | null>(null);
  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"generate" | "samples">("generate");
  const [sampleIdx, setSampleIdx] = useState(0);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [editJson, setEditJson] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!note.trim()) return;
    setLoading(true);
    setError(null);
    setBrief(null);
    setActionState("idle");
    try {
      const res = await fetch("/api/visit-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: note }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Request failed with status ${res.status}`);
      }
      const data = (await res.json()) as VisitBrief;
      setBrief(data);
      setInputText(note);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleLoadSample(id: string) {
    const sn = SAMPLE_NOTES.find((n) => n.id === id);
    if (sn) setNote(sn.text);
  }

  function handleEdit() {
    if (!brief) return;
    setEditJson(JSON.stringify(brief, null, 2));
    setEditError(null);
    setActionState("editing");
  }

  function handleApplyEdit() {
    try {
      const parsed = JSON.parse(editJson) as VisitBrief;
      setBrief(parsed);
      setActionState("idle");
      setEditError(null);
    } catch (e) {
      setEditError("Invalid JSON — " + (e instanceof Error ? e.message : "parse error"));
    }
  }

  const displayBrief = brief ? sanitizeBrief(brief, inputText) : null;
  const [currentFixture, currentFixtureInput] = FIXTURES[sampleIdx];
  const sanitizedFixture = sanitizeBrief(currentFixture, currentFixtureInput);

  return (
    <div className="space-y-6">
      <Disclaimer />

      {/* Mode toggle */}
      <div
        className="flex items-center gap-2 bg-white p-1 w-fit"
        style={{ border: "1px solid #1A2328" }}
      >
        <button
          type="button"
          onClick={() => setViewMode("generate")}
          className={[
            "px-4 py-1.5 text-sm font-medium transition-colors",
            viewMode === "generate"
              ? "bg-[#099A93] text-white"
              : "text-[#484F53] hover:text-[#1A2328]",
          ].join(" ")}
        >
          Generate
        </button>
        <button
          type="button"
          onClick={() => setViewMode("samples")}
          className={[
            "px-4 py-1.5 text-sm font-medium transition-colors",
            viewMode === "samples"
              ? "bg-[#099A93] text-white"
              : "text-[#484F53] hover:text-[#1A2328]",
          ].join(" ")}
        >
          Sample states
        </button>
      </div>

      {viewMode === "samples" ? (
        /* ── Offline sample states ─────────────────────────────────────────── */
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {FIXTURE_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSampleIdx(i)}
                className={[
                  "border px-3 py-1.5 text-xs font-medium transition-colors",
                  sampleIdx === i
                    ? "border-[#099A93] bg-[#D8F5F3] text-[#099A93]"
                    : "border-[#1A2328] text-[#484F53] hover:text-[#1A2328]",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          <VisitBriefRenderer brief={sanitizedFixture} />
          <DebugPanel brief={sanitizedFixture} />
        </div>
      ) : (
        /* ── Generate flow ─────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Input area */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="patient-note" className="text-sm font-medium text-[#1A2328]">
                Patient notes
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#484F53]">Load a sample:</span>
                <select
                  aria-label="Load sample note into textarea"
                  onChange={(e) => { handleLoadSample(e.target.value); e.target.value = ""; }}
                  defaultValue=""
                  className="bg-white px-2 py-1 text-xs text-[#484F53] focus:border-[#099A93] focus:outline-none"
                  style={{ border: "1px solid #1A2328" }}
                >
                  <option value="" disabled>Select…</option>
                  {SAMPLE_NOTES.map((sn) => (
                    <option key={sn.id} value={sn.id}>
                      {sn.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <textarea
              id="patient-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={7}
              placeholder="Paste patient notes, appointment summary, referral letter, or visit description…"
              className="w-full resize-y bg-white px-4 py-3 text-sm text-[#1A2328] placeholder:text-[#484F53] focus:border-[#099A93] focus:outline-none focus:ring-1 focus:ring-[#D8F5F3]"
              style={{ border: "1px solid #1A2328" }}
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !note.trim()}
              className="bg-[#099A93] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#22A49E] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Generating…" : "Generate Visit Brief"}
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div
              className="flex items-center gap-3 px-5 py-4 text-sm text-[#099A93]"
              style={{ border: "1px solid #1A2328", background: "#D8F5F3" }}
            >
              <span
                className="inline-block h-4 w-4 shrink-0 animate-spin border-2 border-[#099A93] border-t-transparent"
                aria-hidden="true"
              />
              Analysing notes and generating visit brief…
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div
              role="alert"
              className="bg-white px-5 py-4 text-sm"
              style={{ border: "1px solid #1A2328" }}
            >
              <strong className="font-semibold text-[#1A2328]">Generation failed: </strong>
              <span className="text-[#484F53]">{error}</span>
            </div>
          )}

          {/* Result + action controls */}
          {displayBrief && !loading && actionState !== "editing" && (
            <div className="space-y-4">
              <VisitBriefRenderer brief={displayBrief} />

              <div
                className="flex flex-wrap items-center gap-3 pt-4"
                style={{ borderTop: "1px solid #1A2328" }}
              >
                {actionState === "approved" ? (
                  <span className="vp-approved-chip">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path
                        d="M2.5 7.5l3 3 6-6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Brief approved
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActionState("approved")}
                    className="bg-white px-4 py-2 text-sm font-medium text-[#1A2328] transition-colors hover:bg-[#D8F5F3]"
                    style={{ border: "1px solid #1A2328" }}
                  >
                    Approve
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleEdit}
                  className="bg-white px-4 py-2 text-sm font-medium text-[#1A2328] transition-colors hover:bg-[#D8F5F3]"
                  style={{ border: "1px solid #1A2328" }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-white px-4 py-2 text-sm font-medium text-[#484F53] transition-colors hover:text-[#1A2328] hover:bg-[#D8F5F3] disabled:opacity-40"
                  style={{ border: "1px solid #1A2328" }}
                >
                  Regenerate
                </button>
              </div>

              <DebugPanel brief={displayBrief} />
            </div>
          )}

          {/* Edit mode — JSON round-trip */}
          {actionState === "editing" && brief && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#1A2328]">Edit VisitBrief JSON</p>
                <p className="text-xs text-[#484F53]">Modify fields and apply to re-render</p>
              </div>
              <textarea
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                rows={20}
                spellCheck={false}
                aria-label="VisitBrief JSON editor"
                className="w-full resize-y bg-white px-4 py-3 font-mono text-xs text-[#1A2328] focus:border-[#099A93] focus:outline-none focus:ring-1 focus:ring-[#D8F5F3]"
                style={{ border: "1px solid #1A2328" }}
              />
              {editError && (
                <p role="alert" className="text-xs font-medium text-[#484F53]">
                  {editError}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleApplyEdit}
                  className="bg-[#099A93] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#22A49E]"
                >
                  Apply Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionState("idle");
                    setEditError(null);
                  }}
                  className="bg-white px-5 py-2 text-sm font-medium text-[#484F53] transition-colors hover:text-[#1A2328]"
                  style={{ border: "1px solid #1A2328" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
