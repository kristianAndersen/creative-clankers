"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { DATASETS, type Dataset } from "@/lib/datasets";
import type { Analysis } from "@/lib/analyze";
import { AnalysisPanel } from "./AnalysisPanel";
import { Upload } from "./Upload";

type Part = {
  type: string;
  text?: string;
  state?: string;
  output?: unknown;
  errorText?: string;
};

const STEPS = ["Read the brief", "Compute (real code)", "Hand back the call"];

export function StudioChat() {
  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [followUp, setFollowUp] = useState("");
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);

  const busy = status === "submitted" || status === "streaming";
  const started = messages.length > 0;

  function runDataset(ds: Dataset) {
    if (busy) return;
    setActiveDataset(ds);
    sendMessage({ text: `Analyze the “${ds.name}” dataset.` }, { body: { dataset: ds } });
  }

  function reset() {
    setMessages([]);
    setFollowUp("");
    setActiveDataset(null);
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const aParts = (lastAssistant?.parts as unknown as Part[]) ?? [];
  const hasToolOutput = aParts.some(
    (p) => p.type === "tool-analyze" && p.state === "output-available",
  );
  const hasTextAfterTool = (() => {
    const toolIdx = aParts.findIndex((p) => p.type === "tool-analyze");
    if (toolIdx === -1) return false;
    return aParts.slice(toolIdx + 1).some((p) => p.type === "text" && p.text?.trim());
  })();
  const activeStep = !started ? -1 : hasTextAfterTool ? 2 : hasToolOutput ? 1 : 0;

  return (
    <div className="space-y-7">
      {/* dataset picker */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-grey-2">
          {started ? "Sample datasets" : "Pick a sample — or upload your own"}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {DATASETS.map((d) => (
            <button
              key={d.id}
              onClick={() => runDataset(d)}
              disabled={busy}
              className="group relative overflow-hidden rounded-xl border border-grey-4 bg-paper p-4 text-left transition-all hover:border-brand hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 brand-gradient-bg transition-transform duration-300 group-hover:scale-x-100" />
              <p className="text-sm font-medium text-ink">{d.name}</p>
              <p className="mt-1 text-xs leading-snug text-grey-2">{d.blurb}</p>
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Upload onAnalyze={runDataset} disabled={busy} />
        </div>
      </div>

      {/* multi-step pipeline */}
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
                {i < STEPS.length - 1 && <span className="text-grey-4">→</span>}
              </span>
            );
          })}
        </div>
      )}

      {/* conversation */}
      <div className="space-y-5">
        {messages.map((message) => {
          const parts = message.parts as unknown as Part[];
          if (message.role === "user") {
            const text = parts.find((p) => p.type === "text")?.text ?? "";
            const m = text.match(/“([^”]+)”|"([^"]+)"/);
            const label = m?.[1] || m?.[2] || activeDataset?.name || "dataset";
            return (
              <p
                key={message.id}
                className="text-xs uppercase tracking-[0.14em] text-grey-2"
              >
                ▸ Brief: analyze “{label}”
              </p>
            );
          }

          return (
            <div key={message.id} className="space-y-4">
              {parts.map((part, i) => {
                if (part.type === "text" && part.text) {
                  const isLast =
                    message.id === lastAssistant?.id &&
                    i === parts.length - 1 &&
                    status === "streaming";
                  return (
                    <p
                      key={i}
                      className={`whitespace-pre-wrap text-[0.97rem] leading-relaxed text-ink-soft ${
                        isLast ? "stream-caret" : ""
                      }`}
                    >
                      {part.text}
                    </p>
                  );
                }

                if (part.type === "tool-analyze") {
                  if (part.state === "output-available" && part.output) {
                    return (
                      <AnalysisPanel key={i} analysis={part.output as Analysis} />
                    );
                  }
                  if (part.state === "output-error") {
                    return (
                      <p key={i} className="text-sm text-human">
                        Analysis failed: {part.errorText}
                      </p>
                    );
                  }
                  return (
                    <p
                      key={i}
                      className="flex items-center gap-2 text-sm text-grey-2"
                    >
                      <span className="step-active inline-block h-2 w-2 rounded-full bg-human" />
                      Running the numbers…
                    </p>
                  );
                }
                return null;
              })}
            </div>
          );
        })}

        {status === "submitted" && (
          <p className="flex items-center gap-2 text-sm text-grey-2">
            <span className="step-active inline-block h-2 w-2 rounded-full bg-human" />
            Reading the brief…
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-human/40 bg-blush px-4 py-3 text-sm text-human-deep">
            {error.message?.includes("GROQ_API_KEY")
              ? "This demo needs a free Groq API key. Add GROQ_API_KEY to .env.local (see .env.example)."
              : `Something went wrong: ${error.message}`}
          </div>
        )}
      </div>

      {/* follow-up + reset */}
      {started && !busy && (
        <div className="flex flex-col gap-3 border-t border-grey-4 pt-5 sm:flex-row">
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!followUp.trim() || !activeDataset) return;
              sendMessage({ text: followUp }, { body: { dataset: activeDataset } });
              setFollowUp("");
            }}
          >
            <input
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Ask a follow-up — e.g. “which line would you watch?”"
              className="flex-1 rounded-full border border-grey-4 bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-grey-3 focus:border-brand"
            />
            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream transition-transform hover:-translate-y-0.5"
            >
              Ask
            </button>
          </form>
          <button
            onClick={reset}
            className="rounded-full border border-grey-4 px-5 py-2.5 text-sm text-grey-2 transition-colors hover:border-ink hover:text-ink"
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
