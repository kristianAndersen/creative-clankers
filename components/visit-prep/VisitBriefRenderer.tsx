import type { VisitBrief, SectionDescriptor } from "@/lib/visit-prep/types";
import { SummaryPanel } from "./SummaryPanel";
import { ConcernsList } from "./ConcernsList";
import { EvidenceList } from "./EvidenceList";
import { QuestionsList } from "./QuestionsList";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { UncertainState } from "./UncertainState";

interface VisitBriefRendererProps {
  brief: VisitBrief;
}

function renderSection(section: SectionDescriptor, brief: VisitBrief) {
  const e = section.emphasis;
  switch (section.kind) {
    case "summary":
      return <SummaryPanel key="summary" summary={brief.summary} emphasis={e} />;
    case "concerns":
      return <ConcernsList key="concerns" concerns={brief.concerns} emphasis={e} />;
    case "evidence":
      return <EvidenceList key="evidence" evidence={brief.evidence} emphasis={e} />;
    case "questions":
      return <QuestionsList key="questions" questions={brief.suggestedQuestions} emphasis={e} />;
    case "confidence":
      return <ConfidenceBadge key="confidence" confidence={brief.confidence} emphasis={e} />;
    default:
      return null;
  }
}

export function VisitBriefRenderer({ brief }: VisitBriefRendererProps) {
  if (brief.status === "uncertain") {
    return <UncertainState reason={brief.reason ?? "Unable to prepare a brief from the provided input."} />;
  }

  const included = brief.sections
    .filter((s) => s.include)
    .sort((a, b) => a.order - b.order);

  if (brief.layout === "dashboard") {
    // Grid: summary left column, concerns + questions right column, evidence + confidence span full width below
    const summarySection = included.find((s) => s.kind === "summary");
    const concernsSection = included.find((s) => s.kind === "concerns");
    const questionsSection = included.find((s) => s.kind === "questions");
    const bottomSections = included.filter(
      (s) => s.kind !== "summary" && s.kind !== "concerns" && s.kind !== "questions"
    );
    return (
      <div className="space-y-4 rise-in">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="flex flex-col gap-4">
            {summarySection && renderSection(summarySection, brief)}
          </div>
          <div className="flex flex-col gap-4">
            {concernsSection && renderSection(concernsSection, brief)}
            {questionsSection && renderSection(questionsSection, brief)}
          </div>
        </div>
        {bottomSections.length > 0 && (
          <div className="space-y-4">
            {bottomSections.map((s) => renderSection(s, brief))}
          </div>
        )}
      </div>
    );
  }

  if (brief.layout === "focus") {
    // Single-column, concerns dominant at top
    const reordered = [
      ...included.filter((s) => s.kind === "concerns"),
      ...included.filter((s) => s.kind === "questions"),
      ...included.filter((s) => s.kind !== "concerns" && s.kind !== "questions"),
    ];
    return (
      <div className="space-y-4 rise-in">
        {reordered.map((s) => renderSection(s, brief))}
      </div>
    );
  }

  if (brief.layout === "minimal") {
    return (
      <div className="mx-auto max-w-xl space-y-3 rise-in">
        {included.map((s) => renderSection(s, brief))}
      </div>
    );
  }

  // stacked (default): balanced single-column
  return (
    <div className="space-y-4 rise-in">
      {included.map((s) => renderSection(s, brief))}
    </div>
  );
}
