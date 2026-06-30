// Synthetic patient notes for the Visit Prep Assistant demo.
// Entirely fictional. No real patients. Primary-care / outpatient context.
// Used as the "load a sample" presets on the /visit-prep page and as test inputs.

export type SampleNote = {
  id: string;
  label: string;
  // Intended demo behavior this note is designed to exercise.
  intent: "confident-multi-section" | "concern-heavy" | "sparse-low-confidence" | "routine" | "uncertain-fallback";
  text: string;
};

export const SAMPLE_NOTES: SampleNote[] = [
  {
    id: "note-hampton",
    label: "HTN + T2DM follow-up (well-documented)",
    intent: "confident-multi-section",
    text: `Patient: Margaret Hampton | 67F | MRN 884201
Visit: Routine primary-care follow-up

Chief complaint: "Here for my 3-month diabetes and blood pressure check."

HPI: 67-year-old woman with type 2 diabetes (dx 2014) and hypertension here for routine follow-up. Reports good adherence to metformin and lisinopril. Home BP log averages 138/84. Checks fingerstick glucose 2-3x/week, fasting values 130-160. Denies polyuria, polydipsia, blurred vision, chest pain, or lower-extremity numbness. Walking 20 min most days; admits diet has "slipped" over the holidays.

PMH: Type 2 diabetes mellitus; essential hypertension; hyperlipidemia; osteoarthritis (knees).
Medications: Metformin 1000 mg PO BID; Lisinopril 20 mg PO daily; Atorvastatin 40 mg PO daily; Aspirin 81 mg PO daily.
Allergies: Sulfa (rash).
Social history: Retired schoolteacher. Never smoker. Alcohol 1-2 glasses wine/week. Lives with spouse.

Vitals: BP 142/86 | HR 72 | BMI 31.4
Labs (this week): HbA1c 7.8% (prior 7.2%); LDL 71; eGFR 68.`,
  },
  {
    id: "note-okafor",
    label: "Polypharmacy + falls (concern-heavy)",
    intent: "concern-heavy",
    text: `Patient: Daniel Okafor | 81M | MRN 773105
Visit: Outpatient follow-up after recent fall

Chief complaint: "I fell again last week getting up at night."

HPI: 81-year-old man with two falls in the past month, both nocturnal en route to the bathroom, no LOC, no head strike. Reports lightheadedness on standing. Wife notes he seems more drowsy since a sleep medication was started. New baseline confusion in the evenings. No fever, chest pain, or palpitations.

PMH: Hypertension; BPH; insomnia; depression; chronic low back pain; prior TIA (2021).
Medications: Amlodipine 10 mg daily; Tamsulosin 0.4 mg daily; Zolpidem 10 mg QHS; Amitriptyline 25 mg QHS; Sertraline 100 mg daily; Oxycodone 5 mg PRN; Aspirin 81 mg daily.
Allergies: NKDA.
Social history: Widower-pending; lives with wife in two-story home, bedroom upstairs. Former smoker (quit 1990). No alcohol. Uses a cane, not consistently.

Vitals: BP sitting 128/76, standing 104/62 (symptomatic) | HR 70 | Gait unsteady on exam.
Labs: Na 133; eGFR 54.`,
  },
  {
    id: "note-reyes",
    label: "Fatigue, vague history (sparse / low-confidence)",
    intent: "sparse-low-confidence",
    text: `Patient: J. Reyes | 34 | new patient
CC: "Tired all the time."

HPI: Several months of fatigue. No other details offered today; patient unsure of timeline. Denies fever.

PMH: "Maybe anemia once?" - unconfirmed.
Meds: none reported.
Allergies: unknown.
Social: works nights.

Vitals: BP 118/74 | HR 80.`,
  },
  {
    id: "note-callahan",
    label: "Young adult URI / cough (routine)",
    intent: "routine",
    text: `Patient: Sophie Callahan | 28F | MRN 902338
Visit: Same-day outpatient

Chief complaint: "Cough and congestion for 5 days."

HPI: 28-year-old woman with 5 days of nasal congestion, sore throat, and a dry cough. Low-grade subjective fevers x2 days, now resolved. No shortness of breath, no chest pain, no wheeze. Sick contacts at work. Tolerating fluids. No COVID test done.

PMH: Mild intermittent asthma (rescue inhaler ~1-2x/month); seasonal allergies.
Medications: Albuterol HFA PRN; Loratadine 10 mg PRN.
Allergies: Penicillin (hives as a child).
Social history: Non-smoker; occasional alcohol; works in retail. No vaping.

Vitals: Temp 37.4 C | BP 116/72 | HR 84 | SpO2 99% RA | RR 16.`,
  },
  {
    id: "note-terse",
    label: "Terse shorthand intake (uncertain / fallback)",
    intent: "uncertain-fallback",
    text: `pt 59 m - f/u
"not feeling great"
hx: dm, htn, ?cad
meds: per pharmacy list
all: ?
soc: -
BP 150s/90s, rest wnl
labs pending`,
  },
];
