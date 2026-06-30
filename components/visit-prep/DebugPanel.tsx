"use client";
import { useState } from "react";
import type { VisitBrief } from "@/lib/visit-prep/types";

interface DebugPanelProps {
  brief: VisitBrief;
}

export function DebugPanel({ brief }: DebugPanelProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white text-sm" style={{ border: "1px solid #1A2328" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-[#484F53] transition-colors hover:text-[#1A2328]"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="inline-flex h-4 w-4 items-center justify-center bg-[#F2F2F2] text-[10px] font-bold text-[#484F53]">
            {"{}"}
          </span>
          Debug · Raw VisitBrief JSON
        </span>
        <svg
          className={["h-4 w-4 transition-transform", open ? "rotate-180" : ""].join(" ")}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <pre
          className="overflow-x-auto px-4 py-4 text-xs leading-relaxed text-[#484F53]"
          style={{ borderTop: "1px solid #1A2328" }}
        >
          {JSON.stringify(brief, null, 2)}
        </pre>
      )}
    </div>
  );
}
