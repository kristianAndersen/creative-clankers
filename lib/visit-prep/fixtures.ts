import type { VisitBrief } from "./types";

// Input texts are exported so tests can call isSourceQuoteValid() with the
// correct source document for each fixture.

export const fixture1InputText =
  "Patient notes from 2024-03-15: John Doe, 68yo male. Recent diagnosis of " +
  "Type 2 diabetes. Starting metformin 500mg. Blood pressure elevated at " +
  "145/90. Family history of cardiovascular disease. Currently on lisinopril " +
  "10mg for hypertension. Upcoming cardiology review next month.";

export const fixture2InputText =
  "follow up appointment on Thursday for knee pain";

export const fixture4InputText =
  "Pre-op assessment for knee replacement surgery. Patient has severe " +
  "osteoarthritis, current pain level 8/10. Relevant meds: ibuprofen 400mg " +
  "PRN, omeprazole 20mg. Allergic to penicillin. Last blood work shows normal " +
  "kidney function. Anesthesiologist consult scheduled.";

// ── Fixture 1: Confident multi-section 'dashboard' layout ───────────────────

export const fixture1: VisitBrief = {
  status: "ok",
  layout: "dashboard",
  sections: [
    { kind: "summary", include: true, emphasis: "primary", order: 0 },
    { kind: "concerns", include: true, emphasis: "primary", order: 1 },
    { kind: "evidence", include: true, emphasis: "normal", order: 2 },
    { kind: "questions", include: true, emphasis: "normal", order: 3 },
    { kind: "confidence", include: true, emphasis: "muted", order: 4 },
  ],
  summary: {
    text:
      "John Doe is a 68-year-old male recently diagnosed with Type 2 diabetes " +
      "and managed hypertension. This visit follows the initiation of metformin " +
      "and precedes an upcoming cardiology review.",
    keyPoints: [
      "New T2DM diagnosis — metformin 500mg initiated",
      "BP 145/90 — lisinopril 10mg ongoing",
      "Family history of cardiovascular disease",
      "Cardiology review scheduled next month",
    ],
  },
  concerns: [
    {
      text: "Blood pressure remains elevated at 145/90 — assess lisinopril efficacy and adherence",
      emphasis: "primary",
    },
    {
      text: "Cardiovascular risk elevated by family history plus new diabetes diagnosis",
      emphasis: "primary",
    },
    {
      text: "Metformin initiation — confirm renal function baseline (eGFR) is documented",
      emphasis: "normal",
    },
  ],
  suggestedQuestions: [
    {
      text: "Has my kidney function been checked before starting metformin?",
      context: "Metformin requires adequate renal function; eGFR should be confirmed.",
    },
    {
      text: "Should the lisinopril dose be reviewed given my blood pressure reading?",
      context: "BP at 145/90 suggests current dose may not be achieving target.",
    },
    {
      text: "What lifestyle changes would most reduce my cardiovascular risk given my family history?",
    },
    {
      text: "What should I expect at the cardiology review next month?",
    },
  ],
  confidence: {
    level: "high",
    rationale:
      "Input contains clear clinical detail: named medications, specific readings, " +
      "documented diagnoses, and a scheduled follow-up. All sections have strong grounding.",
  },
  evidence: [
    {
      claim: "Patient has Type 2 diabetes recently diagnosed",
      sourceQuote: "Recent diagnosis of Type 2 diabetes",
      sectionRef: "summary",
    },
    {
      claim: "Elevated blood pressure at 145/90",
      sourceQuote: "Blood pressure elevated at 145/90",
      sectionRef: "concerns",
    },
    {
      claim: "Currently on lisinopril 10mg for hypertension",
      sourceQuote: "Currently on lisinopril 10mg for hypertension",
      sectionRef: "concerns",
    },
    {
      claim: "Family history of cardiovascular disease increases risk",
      sourceQuote: "Family history of cardiovascular disease",
      sectionRef: "concerns",
    },
    {
      claim: "Metformin 500mg has been initiated",
      sourceQuote: "Starting metformin 500mg",
      sectionRef: "evidence",
    },
  ],
};

// ── Fixture 2: Sparse low-confidence 'stacked' layout ───────────────────────

export const fixture2: VisitBrief = {
  status: "ok",
  layout: "stacked",
  sections: [
    { kind: "summary", include: true, emphasis: "normal", order: 0 },
    { kind: "concerns", include: false, emphasis: "muted", order: 1 },
    { kind: "evidence", include: false, emphasis: "muted", order: 2 },
    { kind: "questions", include: true, emphasis: "normal", order: 3 },
    { kind: "confidence", include: true, emphasis: "muted", order: 4 },
  ],
  summary: {
    text: "A follow-up appointment is noted for Thursday regarding knee pain. No further clinical context is available.",
  },
  concerns: [],
  suggestedQuestions: [
    {
      text: "What assessments or tests should I expect at this follow-up?",
      context: "No prior visit notes available to anticipate the agenda.",
    },
    {
      text: "Is there anything I should bring or prepare for the appointment?",
    },
  ],
  confidence: {
    level: "low",
    rationale:
      "Input contains only a date reference and a symptom keyword. No medications, " +
      "diagnoses, or clinical history were provided to generate a substantive brief.",
  },
  evidence: [
    {
      claim: "Appointment is scheduled for Thursday",
      sourceQuote: "appointment on Thursday",
      sectionRef: "summary",
    },
    {
      claim: "Chief complaint is knee pain",
      sourceQuote: "knee pain",
      sectionRef: "summary",
    },
  ],
};

// ── Fixture 3: Uncertain/fallback state ─────────────────────────────────────

export const fixture3: VisitBrief = {
  status: "uncertain",
  layout: "minimal",
  sections: [
    { kind: "summary", include: false, emphasis: "muted", order: 0 },
    { kind: "concerns", include: false, emphasis: "muted", order: 1 },
    { kind: "evidence", include: false, emphasis: "muted", order: 2 },
    { kind: "questions", include: false, emphasis: "muted", order: 3 },
    { kind: "confidence", include: false, emphasis: "muted", order: 4 },
  ],
  summary: {
    text: "The pasted input did not contain recognizable medical or appointment context.",
  },
  concerns: [],
  suggestedQuestions: [],
  confidence: {
    level: "low",
    rationale: "Input did not contain sufficient clinical information.",
  },
  evidence: [],
  reason:
    "Input did not contain recognizable medical context. Please paste your appointment " +
    "notes, patient summary, referral letter, or a description of your upcoming visit.",
};

// ── Fixture 4: Focus layout — surgical pre-op context ───────────────────────

export const fixture4: VisitBrief = {
  status: "ok",
  layout: "focus",
  sections: [
    { kind: "summary", include: true, emphasis: "normal", order: 0 },
    { kind: "concerns", include: true, emphasis: "primary", order: 1 },
    { kind: "questions", include: true, emphasis: "primary", order: 2 },
    { kind: "evidence", include: true, emphasis: "normal", order: 3 },
    { kind: "confidence", include: false, emphasis: "muted", order: 4 },
  ],
  summary: {
    text:
      "The patient is undergoing pre-operative assessment for knee replacement surgery " +
      "with severe osteoarthritis and a penicillin allergy on record. Anesthesiologist " +
      "consult is already scheduled.",
    keyPoints: [
      "Knee replacement surgery — pre-op assessment",
      "Pain level 8/10 — severe osteoarthritis",
      "Penicillin allergy on record",
      "Normal kidney function (recent blood work)",
    ],
  },
  concerns: [
    {
      text: "Penicillin allergy must be clearly documented for surgical and anesthetic teams",
      emphasis: "primary",
    },
    {
      text: "Ibuprofen 400mg PRN — NSAIDs should typically be paused pre-surgery; confirm with surgeon",
      emphasis: "primary",
    },
    {
      text: "Pain at 8/10 — discuss post-operative pain management plan and expectations",
      emphasis: "normal",
    },
  ],
  suggestedQuestions: [
    {
      text: "Has my penicillin allergy been communicated to all surgical team members?",
      context: "Allergy documentation is critical to safe antibiotic prophylaxis during surgery.",
    },
    {
      text: "Should I stop taking ibuprofen before the procedure and if so, when?",
      context: "NSAIDs can affect bleeding and may need to be paused pre-operatively.",
    },
    {
      text: "What pain management options will be available after the surgery?",
    },
    {
      text: "Is there anything I need to do before the anesthesiologist consult?",
    },
  ],
  confidence: {
    level: "high",
    rationale:
      "Input provides clear pre-operative context with specific medications, allergy, " +
      "pain score, and scheduled consult.",
  },
  evidence: [
    {
      claim: "Severe osteoarthritis with high pain score",
      sourceQuote: "severe osteoarthritis, current pain level 8/10",
      sectionRef: "summary",
    },
    {
      claim: "Patient has documented penicillin allergy",
      sourceQuote: "Allergic to penicillin",
      sectionRef: "concerns",
    },
    {
      claim: "Ibuprofen is being used as needed",
      sourceQuote: "ibuprofen 400mg PRN",
      sectionRef: "concerns",
    },
    {
      claim: "Kidney function is within normal range",
      sourceQuote: "blood work shows normal kidney function",
      sectionRef: "evidence",
    },
    {
      claim: "Anesthesiologist consult is already planned",
      sourceQuote: "Anesthesiologist consult scheduled",
      sectionRef: "questions",
    },
  ],
};
