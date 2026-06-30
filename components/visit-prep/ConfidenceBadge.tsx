import type { ConfidenceIndicator } from "@/lib/visit-prep/types";

const levelConfig = {
  high: { label: "High confidence", dotClass: "bg-[#099A93]", textClass: "text-[#099A93]", borderClass: "border-[#099A93]" },
  medium: { label: "Medium confidence", dotClass: "bg-[#D8F5F3]", textClass: "text-[#1A2328]", borderClass: "border-[#1A2328]" },
  low: { label: "Low confidence", dotClass: "bg-[#484F53]", textClass: "text-[#484F53]", borderClass: "border-[#484F53]" },
} as const;

interface ConfidenceBadgeProps {
  confidence: ConfidenceIndicator;
  emphasis?: "primary" | "normal" | "muted";
}

export function ConfidenceBadge({ confidence, emphasis = "normal" }: ConfidenceBadgeProps) {
  const cfg = levelConfig[confidence.level];
  return (
    <div
      className={[
        "bg-white",
        emphasis === "primary" ? "border-l-4 border-l-[#099A93] p-6" : emphasis === "muted" ? "p-3" : "p-4",
      ].join(" ")}
      style={{ border: "1px solid #1A2328" }}
    >
      <div
        className={[
          "mb-1 text-[#1A2328]",
          emphasis === "primary" ? "text-lg" : emphasis === "muted" ? "text-xs text-[#484F53] uppercase tracking-widest" : "text-sm font-semibold",
        ].join(" ")}
      >
        AI Confidence
      </div>
      <span
        className={[
          "inline-flex items-center gap-2 border px-3 py-1 text-xs font-semibold",
          cfg.textClass,
          cfg.borderClass,
        ].join(" ")}
      >
        <span className={`inline-block h-2 w-2 ${cfg.dotClass}`} />
        {cfg.label}
      </span>
      <p className={["mt-2 text-sm text-[#484F53]", emphasis === "muted" ? "text-xs" : ""].join(" ")}>
        {confidence.rationale}
      </p>
    </div>
  );
}
