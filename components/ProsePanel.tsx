"use client";

import { useEffect, useRef } from "react";
import type { ProduktDetaljer } from "@/lib/medicinpriser.types";
import { PriceChip } from "./PriceChip";
// prose-parser.ts is built by the concurrent foundation agent — import types only.
// tsc will error on this module path; that is expected until the other agent lands.
import type { ProseToken } from "@/lib/prose-parser";
import { parseProse, lockLooseNumbers, toPlainText } from "@/lib/prose-parser";

type Part = {
  type: string;
  text?: string;
  state?: string;
};

type Message = {
  id: string;
  role: string;
  parts: unknown[];
};

// The four price fields the API exposes and the chip knows how to render.
type PriceField = "PrisPrPakning" | "PrisPrEnhed" | "AIP" | "TilskudBeregnesAf";
const PRICE_FIELDS: PriceField[] = ["PrisPrPakning", "PrisPrEnhed", "AIP", "TilskudBeregnesAf"];

function renderTokens(
  tokens: ProseToken[],
  lockedPrices: Map<string, ProduktDetaljer>,
  isLastPart: boolean,
  status: string,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];

  tokens.forEach((token, i) => {
    if (token.type === "text") {
      const isLast = isLastPart && i === tokens.length - 1;
      const streaming = status === "streaming";
      nodes.push(
        <span
          key={i}
          className={isLast && streaming ? "stream-caret" : undefined}
        >
          {token.text}
        </span>
      );
    } else if (token.type === "price") {
      const detail = lockedPrices.get(token.vnr);
      if (!detail) {
        // Tool result not yet in lockedPrices — placeholder; re-renders when map fills.
        nodes.push(
          <span key={i} className="inline-flex items-center gap-1 rounded bg-grey-5 px-1.5 py-0.5 text-sm font-medium text-grey-3">
            …
          </span>
        );
      } else {
        const value = (detail as Record<string, unknown>)[token.field] as number | null | undefined;
        nodes.push(
          <PriceChip
            key={i}
            value={value ?? null}
            field={token.field}
          />
        );
      }
    }
  });

  return nodes;
}

export function ProsePanel({
  messages,
  lockedPrices,
  status,
  copyRef,
}: {
  messages: Message[];
  lockedPrices: Map<string, ProduktDetaljer>;
  status: string;
  copyRef: React.MutableRefObject<string>;
}) {
  const allTextRef = useRef<string>("");

  // Build accumulated plain-text for clipboard on each render.
  useEffect(() => {
    let plain = "";
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      const parts = msg.parts as Part[];
      for (const part of parts) {
        if (part.type === "text" && part.text) {
          // Tokenise and convert to plain text stripping sentinels.
          // Cast Map type — PriceData in prose-parser is structurally compatible
          // but typed narrowly as {[key:string]:number}; ProduktDetaljer has extra
          // string fields. Cast at call boundary until foundation agent lands.
          const tokens = parseProse(part.text);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          plain += toPlainText(tokens, lockedPrices as unknown as any);
        }
      }
    }
    allTextRef.current = plain;
    copyRef.current = plain;
  });

  // Collect assistant text parts to render.
  const assistantParts: { partIdx: number; msgId: string; text: string }[] = [];
  let lastMsgId: string | null = null;

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    lastMsgId = msg.id;
    const parts = msg.parts as Part[];
    parts.forEach((part, idx) => {
      if (part.type === "text" && part.text) {
        assistantParts.push({ msgId: msg.id, partIdx: idx, text: part.text });
      }
    });
  }

  if (assistantParts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {assistantParts.map(({ msgId, partIdx, text }, renderIdx) => {
        const isLast =
          renderIdx === assistantParts.length - 1 && msgId === lastMsgId;

        // Primary path: sentinel parse.
        let tokens = parseProse(text);

        // Fallback path: numeric post-pass for when the LLM skips sentinels.
        // lockLooseNumbers injects [PRICE:vnr:field] sentinels into the raw
        // text wherever a bare number matches a known API price; we then
        // re-parse that string so the injected sentinels become price tokens.
        // Applied only when parseProse found zero sentinels (avoids
        // double-chipping a value that was already sentineled).
        const hasSentinels = tokens.some((t) => t.type === "price");
        if (!hasSentinels && lockedPrices.size > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const withSentinels = lockLooseNumbers(text, lockedPrices as unknown as any);
          tokens = parseProse(withSentinels);
        }

        return (
          <p
            key={`${msgId}-${partIdx}`}
            className="whitespace-pre-wrap text-[0.97rem] leading-relaxed text-ink-soft"
          >
            {renderTokens(tokens, lockedPrices, isLast, status)}
          </p>
        );
      })}
    </div>
  );
}
