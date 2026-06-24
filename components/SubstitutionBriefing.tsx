"use client";

import { useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { ProduktDetaljer } from "@/lib/medicinpriser.types";
import { ReasoningRail } from "./ReasoningRail";
import { ProsePanel } from "./ProsePanel";

type Part = {
  type: string;
  state?: string;
  output?: unknown;
};

type Message = {
  id: string;
  role: string;
  parts: unknown[];
};

// Multi-step tracker labels — mirrors StudioChat.tsx convention.
const STEPS = ["Searching products", "Fetching details", "Drafting memo"];

export function SubstitutionBriefing() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/substitution" }),
  });

  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Accumulates plain-text prose for clipboard — populated by ProsePanel each render.
  const copyRef = useRef<string>("");

  const busy = status === "submitted" || status === "streaming";
  const started = messages.length > 0;

  // Build lockedPrices map by scanning tool-getDetail output-available parts.
  // Re-computed each render (no memo — map grows incrementally, stale reads are safe).
  const lockedPrices = new Map<string, ProduktDetaljer>();
  for (const msg of messages as Message[]) {
    if (msg.role !== "assistant") continue;
    for (const part of msg.parts as Part[]) {
      if (
        part.type === "tool-getDetail" &&
        part.state === "output-available" &&
        part.output &&
        typeof part.output === "object"
      ) {
        const detail = part.output as ProduktDetaljer;
        // Key by Varenummer — the stable identifier the sentinel uses.
        if (detail.Varenummer) {
          lockedPrices.set(detail.Varenummer, detail);
        }
      }
    }
  }

  // Derive active step for the tracker.
  const lastAssistant = [...(messages as Message[])]
    .reverse()
    .find((m) => m.role === "assistant");
  const aParts = (lastAssistant?.parts as Part[]) ?? [];
  const hasSearchResult = aParts.some(
    (p) =>
      (p.type === "tool-searchBySubstance" || p.type === "tool-searchByName") &&
      p.state === "output-available",
  );
  const hasDetailResult = aParts.some(
    (p) => p.type === "tool-getDetail" && p.state === "output-available",
  );
  const hasText = aParts.some((p) => p.type === "text" && (p as { text?: string }).text?.trim());
  const activeStep = !started
    ? -1
    : hasText
    ? 2
    : hasDetailResult
    ? 1
    : hasSearchResult
    ? 0
    : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || busy) return;
    sendMessage({ text: query });
    setQuery("");
  }

  async function handleCopy() {
    if (!copyRef.current) return;
    await navigator.clipboard.writeText(copyRef.current);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-7">
      {/* search input */}
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Type a drug name or active substance — e.g. "metformin 500mg"'
            disabled={busy}
            className="flex-1 rounded-full border border-grey-4 bg-paper px-5 py-3 text-sm text-ink outline-none placeholder:text-grey-3 focus:border-brand disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy || !query.trim()}
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Working…" : "Analyse"}
          </button>
        </div>
      </form>

      {/* multi-step tracker */}
      {started && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {STEPS.map((label, i) => {
            const done = activeStep > i || (activeStep === i && !busy);
            const active = activeStep === i && busy;
            return (
              <span key={label} className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${
                    active
                      ? "step-active border-human bg-blush text-ink"
                      : done
                        ? "border-brand/30 bg-sky text-ink"
                        : "border-grey-4 text-grey-3"
                  }`}
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      active ? "bg-human" : done ? "bg-brand" : "bg-grey-4"
                    }`}
                  />
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="text-grey-4">→</span>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* split panel — appears after first send */}
      {started && (
        <div
          className={`${
            started ? "grid" : "hidden"
          } gap-6 md:grid-cols-[38%_1fr]`}
        >
          {/* left: reasoning rail */}
          <div className="canvas-grid min-h-[200px] overflow-hidden rounded-xl border border-grey-4 bg-paper p-5">
            <ReasoningRail messages={messages as Message[]} status={status} />
          </div>

          {/* right: prose panel */}
          <div className="min-h-[200px] rounded-xl border border-grey-4 bg-paper p-5">
            {hasText ? (
              <ProsePanel
                messages={messages as Message[]}
                lockedPrices={lockedPrices}
                status={status}
                copyRef={copyRef}
              />
            ) : busy ? (
              <p className="flex items-center gap-2 text-sm text-grey-3">
                <span className="step-active inline-block h-1.5 w-1.5 rounded-full bg-human" />
                Preparing memo…
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* submitted spinner before any parts arrive */}
      {status === "submitted" && !started && (
        <p className="flex items-center gap-2 text-sm text-grey-2">
          <span className="step-active inline-block h-2 w-2 rounded-full bg-human" />
          Looking up the product cluster…
        </p>
      )}

      {/* error state — mirrors StudioChat.tsx */}
      {error && (
        <div className="rounded-lg border border-human/40 bg-blush px-4 py-3 text-sm text-human-deep">
          {error.message?.includes("GROQ_API_KEY")
            ? "This demo needs a free Groq API key. Add GROQ_API_KEY to .env.local (see .env.example)."
            : `Something went wrong: ${error.message}`}
        </div>
      )}

      {/* copy memo button — only when streaming is done and prose exists */}
      {started && !busy && hasText && (
        <div className="flex justify-end border-t border-grey-4 pt-5">
          <button
            onClick={handleCopy}
            disabled={busy}
            className="rounded-full border border-grey-4 px-5 py-2.5 text-sm text-grey-2 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
          >
            {copied ? "Copied ✓" : "Copy memo"}
          </button>
        </div>
      )}

      {/* disclaimer */}
      <p className="text-xs text-grey-3">
        This tool surfaces pricing and reimbursement data from medicinpriser.dk
        (economics only). Clinical substitution decisions require licensed
        pharmacist review.
      </p>
    </div>
  );
}
