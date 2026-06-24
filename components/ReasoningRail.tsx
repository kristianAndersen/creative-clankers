"use client";

import { useEffect, useRef, useState } from "react";

type Part = {
  type: string;
  data?: unknown;
};

type Message = {
  id: string;
  role: string;
  parts: unknown[];
};

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

  // Collect new lines from data-step parts; dedupe by a stable key.
  useEffect(() => {
    const newLines: RailLine[] = [];

    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      const parts = msg.parts as Part[];

      parts.forEach((part, idx) => {
        if (part.type !== "data-step") return;
        const stepData = part.data as
          | { dir: "in" | "out"; text: string }
          | undefined;
        if (!stepData) return;

        const key = `${msg.id}-${idx}`;
        if (!seenRef.current.has(key)) {
          seenRef.current.add(key);
          newLines.push({ id: key, text: stepData.text, dir: stepData.dir });
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
