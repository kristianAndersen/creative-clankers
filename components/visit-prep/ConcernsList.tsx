import type { Concern } from "@/lib/visit-prep/types";

interface ConcernsListProps {
  concerns: Concern[];
  emphasis?: "primary" | "normal" | "muted";
}

const emphasisConcernStyle: Record<Concern["emphasis"], string> = {
  primary: "border-l-4 border-l-[#099A93] bg-[#D8F5F3]",
  normal: "border-l-4 border-l-[#484F53] bg-[#F2F2F2]",
  muted: "border-l-2 border-l-[#484F53] bg-white opacity-75",
};

export function ConcernsList({ concerns, emphasis = "normal" }: ConcernsListProps) {
  if (concerns.length === 0) return null;
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
          emphasis === "primary" ? "mb-4 text-lg" : emphasis === "muted" ? "mb-2 text-xs uppercase tracking-widest text-[#484F53]" : "mb-3 text-base",
        ].join(" ")}
      >
        Concerns to Raise
      </h3>
      <ul className="space-y-2.5">
        {concerns.map((concern, i) => (
          <li
            key={i}
            className={["px-4 py-3 text-sm text-[#1A2328]", emphasisConcernStyle[concern.emphasis]].join(" ")}
          >
            {concern.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
