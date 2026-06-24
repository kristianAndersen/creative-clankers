// Sample business datasets for the demo. Generic on purpose — no domain
// expertise required to read them. Each is a "current vs previous period"
// breakdown across one dimension, so the analysis math is real and uniform.
//
// `goodDirection` matters: for support tickets, growth is BAD. The agent must
// not celebrate a rise — which is exactly where human judgment earns its keep.

export type DataPoint = {
  label: string;
  current: number;
  previous?: number; // omitted in single-metric mode
};

export type Dataset = {
  id: string;
  name: string;
  blurb: string;
  dimension: string; // what the rows are broken down by
  metric: string; // what the numbers measure
  unit: "currency" | "count";
  currencyCode?: string;
  period: string; // e.g. "Q3 vs Q2 2026" (compare) or a snapshot label (single)
  goodDirection: "up" | "down";
  // "compare" = current vs previous period. "single" = rank & share of one
  // metric, no before/after. Defaults to "compare".
  mode?: "compare" | "single";
  aggregation?: "sum" | "average"; // single mode only
  points: DataPoint[];
};

export const DATASETS: Dataset[] = [
  {
    id: "regional-revenue",
    name: "Regional revenue",
    blurb: "Quarterly revenue by region. Modest growth overall — but it hides a big swing.",
    dimension: "Region",
    metric: "Revenue",
    unit: "currency",
    currencyCode: "EUR",
    period: "Q3 vs Q2 2026",
    goodDirection: "up",
    points: [
      { label: "Nordics", previous: 1240, current: 1310 },
      { label: "DACH", previous: 980, current: 1175 },
      { label: "UK & Ireland", previous: 1420, current: 1180 },
      { label: "Benelux", previous: 610, current: 655 },
      { label: "France", previous: 720, current: 690 },
      { label: "Iberia", previous: 430, current: 612 },
    ],
  },
  {
    id: "signups-by-channel",
    name: "New signups by channel",
    blurb: "Where new users came from this month vs last. A budget-reallocation question in disguise.",
    dimension: "Channel",
    metric: "New signups",
    unit: "count",
    period: "April vs March 2026",
    goodDirection: "up",
    points: [
      { label: "Organic", previous: 3200, current: 3420 },
      { label: "Paid Search", previous: 2100, current: 1680 },
      { label: "Social", previous: 1450, current: 2310 },
      { label: "Referral", previous: 890, current: 980 },
      { label: "Email", previous: 1120, current: 1090 },
      { label: "Partnerships", previous: 340, current: 520 },
    ],
  },
  {
    id: "support-tickets",
    name: "Support tickets by category",
    blurb: "Tickets opened this week vs last. Here, going UP is bad — the agent shouldn't cheer.",
    dimension: "Category",
    metric: "Tickets opened",
    unit: "count",
    period: "This week vs last week",
    goodDirection: "down",
    points: [
      { label: "Billing", previous: 210, current: 198 },
      { label: "Onboarding", previous: 145, current: 240 },
      { label: "Bug reports", previous: 320, current: 305 },
      { label: "Feature requests", previous: 180, current: 195 },
      { label: "Account access", previous: 90, current: 250 },
      { label: "Other", previous: 60, current: 72 },
    ],
  },
];

export function getDataset(id: string): Dataset | undefined {
  return DATASETS.find((d) => d.id === id);
}
