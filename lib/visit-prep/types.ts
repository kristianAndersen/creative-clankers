import type { z } from "zod";
import type {
  SectionKindSchema,
  LayoutTemplateSchema,
  EmphasisSchema,
  ConfidenceLevelSchema,
  SectionDescriptorSchema,
  EvidenceItemSchema,
  ConcernSchema,
  SuggestedQuestionSchema,
  ConfidenceIndicatorSchema,
  VisitSummarySchema,
  VisitBriefSchema,
} from "./schema";

export type SectionKind = z.infer<typeof SectionKindSchema>;
export type LayoutTemplate = z.infer<typeof LayoutTemplateSchema>;
export type Emphasis = z.infer<typeof EmphasisSchema>;
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;
export type SectionDescriptor = z.infer<typeof SectionDescriptorSchema>;
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type Concern = z.infer<typeof ConcernSchema>;
export type SuggestedQuestion = z.infer<typeof SuggestedQuestionSchema>;
export type ConfidenceIndicator = z.infer<typeof ConfidenceIndicatorSchema>;
export type VisitSummary = z.infer<typeof VisitSummarySchema>;
export type VisitBrief = z.infer<typeof VisitBriefSchema>;

/** Narrowed type for a fully confident brief. */
export type VisitBriefOk = VisitBrief & { status: "ok" };

/** Narrowed type for the fallback/uncertain state. */
export type VisitBriefUncertain = VisitBrief & { status: "uncertain"; reason: string };
