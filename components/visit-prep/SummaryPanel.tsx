import type { VisitSummary } from "@/lib/visit-prep/types";

interface SummaryPanelProps {
  summary: VisitSummary;
  emphasis?: "primary" | "normal" | "muted";
}

export function SummaryPanel({ summary, emphasis = "normal" }: SummaryPanelProps) {
  return (
    <div
      className={[
        "rounded-xl border border-grey-4 bg-paper",
        emphasis === "primary" ? "border-l-4 border-l-brand p-6" : emphasis === "muted" ? "p-3" : "p-4",
      ].join(" ")}
    >
      <h3
        className={[
          "font-semibold text-ink",
          emphasis === "primary" ? "mb-3 text-lg" : emphasis === "muted" ? "mb-1 text-xs uppercase tracking-widest text-grey-2" : "mb-2 text-base",
        ].join(" ")}
      >
        Visit Summary
      </h3>
      <p className="text-sm leading-relaxed text-ink-soft">{summary.text}</p>
      {summary.keyPoints && summary.keyPoints.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {summary.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
