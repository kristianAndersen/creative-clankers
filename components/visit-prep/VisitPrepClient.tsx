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
      <div className="flex items-center gap-2 rounded-xl border border-grey-4 bg-paper p-1 w-fit">
        <button
          type="button"
          onClick={() => setViewMode("generate")}
          className={[
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            viewMode === "generate" ? "bg-brand text-white shadow-sm" : "text-grey-2 hover:text-ink",
          ].join(" ")}
        >
          Generate
        </button>
        <button
          type="button"
          onClick={() => setViewMode("samples")}
          className={[
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            viewMode === "samples" ? "bg-brand text-white shadow-sm" : "text-grey-2 hover:text-ink",
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
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  sampleIdx === i
                    ? "border-brand bg-sky text-brand"
                    : "border-grey-4 text-grey-2 hover:border-grey-3 hover:text-ink",
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
              <label htmlFor="patient-note" className="text-sm font-medium text-ink">
                Patient notes
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-grey-2">Load a sample:</span>
                <select
                  aria-label="Load sample note into textarea"
                  onChange={(e) => { handleLoadSample(e.target.value); e.target.value = ""; }}
                  defaultValue=""
                  className="rounded-lg border border-grey-4 bg-paper px-2 py-1 text-xs text-ink-soft focus:border-brand focus:outline-none"
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
              className="w-full resize-y rounded-xl border border-grey-4 bg-paper px-4 py-3 text-sm text-ink placeholder:text-grey-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-sky"
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !note.trim()}
              className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Generating…" : "Generate Visit Brief"}
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center gap-3 rounded-xl border border-grey-4 bg-sky px-5 py-4 text-sm text-brand">
              <span
                className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent"
                aria-hidden="true"
              />
              Analysing notes and generating visit brief…
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div
              role="alert"
              className="rounded-xl border border-red bg-blush px-5 py-4 text-sm"
            >
              <strong className="font-semibold text-red">Generation failed: </strong>
              <span className="text-ink-soft">{error}</span>
            </div>
          )}

          {/* Result + action controls */}
          {displayBrief && !loading && actionState !== "editing" && (
            <div className="space-y-4">
              <VisitBriefRenderer brief={displayBrief} />

              <div className="flex flex-wrap items-center gap-3 border-t border-grey-4 pt-4">
                {actionState === "approved" ? (
                  <span className="flex items-center gap-2 rounded-full bg-mint px-4 py-1.5 text-sm font-semibold text-emerald-700">
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
                    className="rounded-xl border border-grey-4 bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-grey-3 hover:bg-cool"
                  >
                    Approve
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleEdit}
                  className="rounded-xl border border-grey-4 bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-grey-3 hover:bg-cool"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="rounded-xl border border-grey-4 bg-paper px-4 py-2 text-sm font-medium text-grey-2 transition-colors hover:border-grey-3 hover:text-ink disabled:opacity-40"
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
                <p className="text-sm font-medium text-ink">Edit VisitBrief JSON</p>
                <p className="text-xs text-grey-2">Modify fields and apply to re-render</p>
              </div>
              <textarea
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                rows={20}
                spellCheck={false}
                aria-label="VisitBrief JSON editor"
                className="w-full resize-y rounded-xl border border-grey-4 bg-paper px-4 py-3 font-mono text-xs text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-sky"
              />
              {editError && (
                <p role="alert" className="text-xs font-medium text-red">
                  {editError}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleApplyEdit}
                  className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-bright"
                >
                  Apply Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionState("idle");
                    setEditError(null);
                  }}
                  className="rounded-xl border border-grey-4 bg-paper px-5 py-2 text-sm font-medium text-grey-2 transition-colors hover:text-ink"
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
