import type { ConfidenceIndicator } from "@/lib/visit-prep/types";

const levelConfig = {
  high: { label: "High confidence", dot: "bg-mint", text: "text-emerald-700", ring: "ring-emerald-200" },
  medium: { label: "Medium confidence", dot: "bg-sky", text: "text-brand", ring: "ring-sky" },
  low: { label: "Low confidence", dot: "bg-blush", text: "text-orange-deep", ring: "ring-orange-200" },
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
        "rounded-xl border border-grey-4 bg-paper",
        emphasis === "primary" ? "border-l-4 border-l-brand p-6" : emphasis === "muted" ? "p-3" : "p-4",
      ].join(" ")}
    >
      <div
        className={[
          "mb-1 font-semibold text-ink",
          emphasis === "primary" ? "text-lg" : emphasis === "muted" ? "text-xs text-grey-2 uppercase tracking-widest" : "text-sm",
        ].join(" ")}
      >
        AI Confidence
      </div>
      <span
        className={[
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1",
          cfg.text,
          cfg.ring,
        ].join(" ")}
      >
        <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
      <p className={["mt-2 text-sm text-ink-soft", emphasis === "muted" ? "text-xs" : ""].join(" ")}>
        {confidence.rationale}
      </p>
    </div>
  );
}
