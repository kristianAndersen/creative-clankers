import type { SuggestedQuestion } from "@/lib/visit-prep/types";

interface QuestionsListProps {
  questions: SuggestedQuestion[];
  emphasis?: "primary" | "normal" | "muted";
}

export function QuestionsList({ questions, emphasis = "normal" }: QuestionsListProps) {
  if (questions.length === 0) return null;
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
        Questions to Ask
      </h3>
      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#099A93] text-xs font-semibold text-white"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <div>
              <p className="font-medium text-[#1A2328]">{q.text}</p>
              {q.context && (
                <p className="mt-0.5 text-xs text-[#484F53]">{q.context}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
