import type { EvidenceItem } from "@/lib/visit-prep/types";

interface EvidenceListProps {
  evidence: EvidenceItem[];
  emphasis?: "primary" | "normal" | "muted";
}

export function EvidenceList({ evidence, emphasis = "normal" }: EvidenceListProps) {
  if (evidence.length === 0) return null;
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
        Source Evidence
      </h3>
      <ul className="space-y-4">
        {evidence.map((item, i) => (
          <li key={i} className="text-sm">
            <p className="font-medium text-[#1A2328]">{item.claim}</p>
            <blockquote
              className="mt-1.5 border-l-4 border-l-[#099A93] bg-[#D8F5F3] px-4 py-2 italic text-[#484F53]"
            >
              &ldquo;{item.sourceQuote}&rdquo;
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
}
