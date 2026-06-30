import type { Concern } from "@/lib/visit-prep/types";

interface ConcernsListProps {
  concerns: Concern[];
  emphasis?: "primary" | "normal" | "muted";
}

const emphasisConcernStyle: Record<Concern["emphasis"], string> = {
  primary: "border-l-4 border-l-orange-deep bg-blush",
  normal: "border-l-4 border-l-grey-3 bg-cool",
  muted: "border-l-2 border-l-grey-4 bg-paper opacity-75",
};

export function ConcernsList({ concerns, emphasis = "normal" }: ConcernsListProps) {
  if (concerns.length === 0) return null;
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
          emphasis === "primary" ? "mb-4 text-lg" : emphasis === "muted" ? "mb-2 text-xs uppercase tracking-widest text-grey-2" : "mb-3 text-base",
        ].join(" ")}
      >
        Concerns to Raise
      </h3>
      <ul className="space-y-2.5">
        {concerns.map((concern, i) => (
          <li
            key={i}
            className={["rounded-lg px-4 py-3 text-sm text-ink", emphasisConcernStyle[concern.emphasis]].join(" ")}
          >
            {concern.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
