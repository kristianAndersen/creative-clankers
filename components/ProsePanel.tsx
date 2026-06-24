"use client";

import { useEffect } from "react";
import type { ProduktDetaljer } from "@/lib/medicinpriser.types";
import { PriceChip } from "./PriceChip";
import { MemoTable, rankedToPlainText } from "./MemoTable";
import type { RankedRow } from "@/lib/substitution";
import { parseProse, lockLooseNumbers, toPlainText } from "@/lib/prose-parser";
import { segmentMarkdown } from "@/lib/markdown";
import type { MdBlock, MdInline } from "@/lib/markdown";

type Part = {
  type: string;
  text?: string;
  state?: string;
  data?: unknown;
};

type Message = {
  id: string;
  role: string;
  parts: unknown[];
};

function renderInlineSegs(
  inline: MdInline[],
  lockedPrices: Map<string, ProduktDetaljer>,
  streamCaret: boolean,
  status: string,
): React.ReactNode[] {
  return inline.map((seg, i) => {
    const isLast = streamCaret && i === inline.length - 1;
    if (seg.kind === "text") {
      return (
        <span key={i} className={isLast && status === "streaming" ? "stream-caret" : undefined}>
          {seg.text}
        </span>
      );
    }
    if (seg.kind === "bold") {
      return (
        <strong key={i} className="font-semibold text-ink">
          {seg.text}
        </strong>
      );
    }
    // price token
    const detail = lockedPrices.get(seg.vnr);
    if (!detail) {
      return (
        <span key={i} className="inline-flex items-center gap-1 rounded bg-grey-5 px-1.5 py-0.5 text-sm font-medium text-grey-3">
          …
        </span>
      );
    }
    const value = (detail as Record<string, unknown>)[seg.field] as number | null | undefined;
    return <PriceChip key={i} value={value ?? null} field={seg.field} />;
  });
}

function renderBlocks(
  blocks: MdBlock[],
  lockedPrices: Map<string, ProduktDetaljer>,
  isLastPart: boolean,
  status: string,
): React.ReactNode[] {
  return blocks.map((block, bi) => {
    const isLastBlock = isLastPart && bi === blocks.length - 1;
    if (block.kind === "heading") {
      if (block.level === 2) {
        return (
          <h2 key={bi} className="font-display text-[0.9rem] font-semibold text-ink">
            {renderInlineSegs(block.inline, lockedPrices, false, status)}
          </h2>
        );
      }
      return (
        <h3 key={bi} className="font-display text-[0.85rem] font-semibold text-ink-soft">
          {renderInlineSegs(block.inline, lockedPrices, false, status)}
        </h3>
      );
    }
    return (
      <p key={bi} className="whitespace-pre-line text-[0.97rem] leading-relaxed text-ink-soft">
        {renderInlineSegs(block.inline, lockedPrices, isLastBlock, status)}
      </p>
    );
  });
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
  // Build accumulated plain-text for clipboard on each render.
  useEffect(() => {
    let plain = "";
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      const parts = msg.parts as Part[];
      for (const part of parts) {
        if (part.type === "text" && part.text) {
          const tokens = parseProse(part.text);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          plain += toPlainText(tokens, lockedPrices as unknown as any);
        } else if (part.type === "data-ranked" && Array.isArray(part.data)) {
          const rows = part.data as RankedRow[];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          plain += rankedToPlainText(rows, lockedPrices as unknown as any);
          plain += "\n\n";
        }
      }
    }
    copyRef.current = plain;
  });

  // Collect renderable items in message part order (data-ranked then text).
  type RenderItem =
    | { kind: "text"; msgId: string; partIdx: number; text: string }
    | { kind: "ranked"; msgId: string; partIdx: number; rows: RankedRow[] };

  const items: RenderItem[] = [];
  let lastMsgId: string | null = null;

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    lastMsgId = msg.id;
    const parts = msg.parts as Part[];
    parts.forEach((part, idx) => {
      if (part.type === "text" && part.text) {
        items.push({ kind: "text", msgId: msg.id, partIdx: idx, text: part.text });
      } else if (part.type === "data-ranked" && Array.isArray(part.data)) {
        items.push({ kind: "ranked", msgId: msg.id, partIdx: idx, rows: part.data as RankedRow[] });
      }
    });
  }

  if (items.length === 0) return null;

  // Index of last text item — streaming caret attaches to its last inline segment.
  const lastTextIdx = items.reduce((acc, item, i) => (item.kind === "text" ? i : acc), -1);

  return (
    <div className="space-y-4">
      {items.map((item, renderIdx) => {
        if (item.kind === "ranked") {
          return (
            <MemoTable
              key={`${item.msgId}-${item.partIdx}`}
              ranked={item.rows}
              lockedPrices={lockedPrices}
            />
          );
        }

        const isLast = renderIdx === lastTextIdx && item.msgId === lastMsgId;

        // Fallback: inject sentinels for bare numbers when LLM skips them.
        let processedText = item.text;
        if (!processedText.includes("[PRICE:") && lockedPrices.size > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          processedText = lockLooseNumbers(processedText, lockedPrices as unknown as any);
        }
        const blocks = segmentMarkdown(processedText);

        return (
          <div key={`${item.msgId}-${item.partIdx}`} className="space-y-3">
            {renderBlocks(blocks, lockedPrices, isLast, status)}
          </div>
        );
      })}
    </div>
  );
}
