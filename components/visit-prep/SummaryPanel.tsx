import type { VisitSummary } from "@/lib/visit-prep/types";

interface SummaryPanelProps {
  summary: VisitSummary;
  emphasis?: "primary" | "normal" | "muted";
}

export function SummaryPanel({ summary, emphasis = "normal" }: SummaryPanelProps) {
  return (
    <div
      className={[
        "bg-white",
        emphasis === "primary" ? "border-l-4 border-l-[#099A93] p-6" : emphasis === "muted" ? "p-3" : "p-4",
      ].join(" ")}
      style={{ border: "1px solid #1A2328" }}
    >
      <h3
        className={[
          "text-[#000000]",
          emphasis === "primary" ? "mb-3 text-lg" : emphasis === "muted" ? "mb-1 text-xs uppercase tracking-widest text-[#484F53]" : "mb-2 text-base",
        ].join(" ")}
      >
        Visit Summary
      </h3>
      <p className="text-sm leading-relaxed text-[#484F53]">{summary.text}</p>
      {summary.keyPoints && summary.keyPoints.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {summary.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#1A2328]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#099A93]" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
