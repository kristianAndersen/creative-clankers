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
        Source Evidence
      </h3>
      <ul className="space-y-4">
        {evidence.map((item, i) => (
          <li key={i} className="text-sm">
            <p className="font-medium text-ink">{item.claim}</p>
            <blockquote className="mt-1.5 rounded-r-lg border-l-4 border-brand bg-sky px-4 py-2 italic text-ink-soft">
              &ldquo;{item.sourceQuote}&rdquo;
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
}
