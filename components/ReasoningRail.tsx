"use client";

import { useEffect, useRef, useState } from "react";
import type { ProduktDetaljer } from "@/lib/medicinpriser.types";

// Part type as returned by useChat — tool-call parts carry input + output.
// part.input holds the tool arguments (AI SDK v6 field name — flagged assumption).
type Part = {
  type: string;
  state?: string;
  input?: unknown;
  output?: unknown;
};

type Message = {
  id: string;
  role: string;
  parts: unknown[];
};

const TOOL_LABELS: Record<string, string> = {
  "tool-searchBySubstance": "searchBySubstance",
  "tool-searchByName": "searchByName",
  "tool-getDetail": "getDetail",
};

function summariseOutput(toolType: string, output: unknown): string {
  if (!output || typeof output !== "object") return "done";
  const obj = output as Record<string, unknown>;

  if (toolType === "tool-getDetail") {
    const detail = obj as Partial<ProduktDetaljer>;
    if (detail.Udgaaet) {
      return `Fetched ${detail.Navn ?? "product"} — marked Udgaaet, excluding`;
    }
    return `Fetched detail for ${detail.Navn ?? "product"}`;
  }

  if (
    toolType === "tool-searchBySubstance" ||
    toolType === "tool-searchByName"
  ) {
    const arr = Array.isArray(output) ? output : obj.results;
    if (Array.isArray(arr)) {
      return `${arr.length} result${arr.length !== 1 ? "s" : ""}`;
    }
  }

  return "done";
}

function previewInput(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const obj = input as Record<string, unknown>;
  const val = Object.values(obj)[0];
  if (typeof val === "string") {
    return val.length > 32 ? `"${val.slice(0, 32)}…"` : `"${val}"`;
  }
  return "";
}

type RailLine = {
  id: string;
  text: string;
  dir: "in" | "out";
};

export function ReasoningRail({
  messages,
  status,
}: {
  messages: Message[];
  status: string;
}) {
  const [visibleLines, setVisibleLines] = useState<RailLine[]>([]);
  const queueRef = useRef<RailLine[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const drainRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Collect new lines from message parts; dedupe by a stable key.
  useEffect(() => {
    const newLines: RailLine[] = [];

    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      const parts = msg.parts as Part[];

      parts.forEach((part, idx) => {
        const toolLabel = TOOL_LABELS[part.type];
        if (!toolLabel) return;

        if (part.state === "input-available") {
          const key = `${msg.id}-${idx}-in`;
          if (!seenRef.current.has(key)) {
            seenRef.current.add(key);
            const preview = previewInput(part.input);
            newLines.push({
              id: key,
              text: `${toolLabel}${preview ? `: ${preview}` : ""}`,
              dir: "in",
            });
          }
        }

        if (part.state === "output-available") {
          const key = `${msg.id}-${idx}-out`;
          if (!seenRef.current.has(key)) {
            seenRef.current.add(key);
            const summary = summariseOutput(part.type, part.output);
            newLines.push({
              id: key,
              text: summary,
              dir: "out",
            });
          }
        }
      });
    }

    if (newLines.length > 0) {
      queueRef.current = [...queueRef.current, ...newLines];
    }
  }, [messages]);

  // Drain queue at ~80ms per line.
  useEffect(() => {
    if (drainRef.current) return; // already running
    drainRef.current = setInterval(() => {
      const next = queueRef.current.shift();
      if (next) {
        setVisibleLines((prev) => [...prev, next]);
      }
    }, 80);

    return () => {
      if (drainRef.current) {
        clearInterval(drainRef.current);
        drainRef.current = null;
      }
    };
  }, []);

  // Scroll to bottom when new lines appear.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleLines]);

  const streaming = status === "streaming" || status === "submitted";
  const hasContent = visibleLines.length > 0;

  return (
    <div className="flex h-full flex-col">
      {hasContent ? (
        <div className="flex-1 overflow-y-auto">
          <p className="mb-3 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-grey-3">
            Reasoning trace
          </p>
          <div className="space-y-1">
            {visibleLines.map((line) => (
              <p key={line.id} className="flex items-start gap-1.5 font-mono text-xs leading-relaxed">
                {line.dir === "in" ? (
                  <>
                    <span className="mt-px shrink-0 text-machine">→</span>
                    <span className="text-ink-soft">{line.text}</span>
                  </>
                ) : (
                  <>
                    <span className="mt-px shrink-0 text-grey-2">←</span>
                    <span className="text-grey-2">{line.text}</span>
                  </>
                )}
              </p>
            ))}

            {streaming && (
              <p className="flex items-center gap-1.5 font-mono text-xs text-grey-3">
                <span className="step-active inline-block h-1.5 w-1.5 rounded-full bg-machine" />
                working…
              </p>
            )}
          </div>

          {!streaming && hasContent && (
            <hr className="mt-4 border-grey-4" />
          )}

          <div ref={bottomRef} />
        </div>
      ) : streaming ? (
        <div className="flex items-center gap-1.5 font-mono text-xs text-grey-3">
          <span className="step-active inline-block h-1.5 w-1.5 rounded-full bg-machine" />
          initialising…
        </div>
      ) : null}
    </div>
  );
}
