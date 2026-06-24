// Deterministic analysis. This is the whole integrity of the demo: the LLM
// never does the arithmetic. It calls analyze(), real code computes the
// numbers, and the model only narrates what it's given. No hallucinated stats.
//
// Two shapes, picked by dataset.mode:
//   "compare" — current vs previous period (growth, deltas)
//   "single"  — rank & share of one metric, no before/after

import { getDataset, type Dataset } from "./datasets";

function round(n: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

// ── Shared sub-types ──
export type PointAnalysis = {
  label: string;
  current: number;
  previous: number;
  delta: number;
  growthPct: number;
  shareOfCurrent: number;
};

export type CompareAnalysis = {
  mode: "compare";
  datasetId: string;
  name: string;
  metric: string;
  dimension: string;
  unit: Dataset["unit"];
  currencyCode?: string;
  period: string;
  goodDirection: "up" | "down";
  totals: { current: number; previous: number; delta: number; growthPct: number };
  points: PointAnalysis[];
  topGrower: { label: string; growthPct: number };
  topDecliner: { label: string; growthPct: number };
  biggestContributor: { label: string; shareOfCurrent: number };
  outliers: { label: string; growthPct: number; reason: string }[];
  concentration: { topShare: number; note: string };
};

export type SinglePoint = { label: string; value: number; share: number };

export type SingleAnalysis = {
  mode: "single";
  datasetId: string;
  name: string;
  metric: string;
  dimension: string;
  unit: Dataset["unit"];
  currencyCode?: string;
  aggregation: "sum" | "average";
  total: number;
  points: SinglePoint[];
  largest: { label: string; value: number; share: number };
  smallest: { label: string; value: number };
  average: number;
  outliers: { label: string; value: number; reason: string }[];
  concentration: { topShare: number; note: string };
};

export type Analysis = CompareAnalysis | SingleAnalysis;

// ── Dispatcher ──
export function analyze(ds: Dataset): Analysis {
  if (!ds || !Array.isArray(ds.points) || ds.points.length === 0) {
    throw new Error("Dataset has no rows to analyze.");
  }
  return ds.mode === "single" ? analyzeSingle(ds) : analyzeCompare(ds);
}

export function analyzeById(id: string): Analysis {
  const ds = getDataset(id);
  if (!ds) throw new Error(`Unknown datasetId "${id}".`);
  return analyze(ds);
}

// ── Compare mode ──
function analyzeCompare(ds: Dataset): CompareAnalysis {
  const totalPrev = ds.points.reduce((s, p) => s + (p.previous ?? 0), 0);
  const totalCur = ds.points.reduce((s, p) => s + p.current, 0);

  const points: PointAnalysis[] = ds.points.map((p) => {
    const prev = p.previous ?? 0;
    const delta = p.current - prev;
    const growthPct = prev === 0 ? 0 : (delta / prev) * 100;
    return {
      label: p.label,
      current: p.current,
      previous: prev,
      delta,
      growthPct: round(growthPct),
      shareOfCurrent: round(totalCur === 0 ? 0 : (p.current / totalCur) * 100),
    };
  });

  const growths = points.map((p) => p.growthPct);
  const mean = growths.reduce((s, g) => s + g, 0) / growths.length;
  const std = Math.sqrt(
    growths.reduce((s, g) => s + (g - mean) ** 2, 0) / growths.length,
  );

  const outliers = points
    .filter((p) => std > 0 && Math.abs(p.growthPct - mean) > std)
    .map((p) => ({
      label: p.label,
      growthPct: p.growthPct,
      reason:
        p.growthPct > mean
          ? `${round(p.growthPct - mean)} pts above the ${round(mean)}% average move`
          : `${round(mean - p.growthPct)} pts below the ${round(mean)}% average move`,
    }))
    .sort((a, b) => Math.abs(b.growthPct - mean) - Math.abs(a.growthPct - mean));

  const byGrowth = [...points].sort((a, b) => b.growthPct - a.growthPct);
  const byShare = [...points].sort((a, b) => b.shareOfCurrent - a.shareOfCurrent);
  const top = byShare[0];

  return {
    mode: "compare",
    datasetId: ds.id,
    name: ds.name,
    metric: ds.metric,
    dimension: ds.dimension,
    unit: ds.unit,
    currencyCode: ds.currencyCode,
    period: ds.period,
    goodDirection: ds.goodDirection,
    totals: {
      current: totalCur,
      previous: totalPrev,
      delta: totalCur - totalPrev,
      growthPct: round(totalPrev === 0 ? 0 : ((totalCur - totalPrev) / totalPrev) * 100),
    },
    points,
    topGrower: { label: byGrowth[0].label, growthPct: byGrowth[0].growthPct },
    topDecliner: {
      label: byGrowth[byGrowth.length - 1].label,
      growthPct: byGrowth[byGrowth.length - 1].growthPct,
    },
    biggestContributor: { label: top.label, shareOfCurrent: top.shareOfCurrent },
    outliers,
    concentration: {
      topShare: top.shareOfCurrent,
      note:
        top.shareOfCurrent > 35
          ? `${top.label} alone is ${top.shareOfCurrent}% of the total — concentration risk.`
          : `No single ${ds.dimension.toLowerCase()} dominates; the mix is fairly balanced.`,
    },
  };
}

// ── Single-metric mode ──
function analyzeSingle(ds: Dataset): SingleAnalysis {
  const total = ds.points.reduce((s, p) => s + p.current, 0);
  const points: SinglePoint[] = ds.points
    .map((p) => ({
      label: p.label,
      value: p.current,
      share: round(total === 0 ? 0 : (p.current / total) * 100),
    }))
    .sort((a, b) => b.value - a.value);

  const values = points.map((p) => p.value);
  const average = round(values.reduce((s, v) => s + v, 0) / values.length, 2);
  const std = Math.sqrt(
    values.reduce((s, v) => s + (v - average) ** 2, 0) / values.length,
  );

  const outliers = points
    .filter((p) => std > 0 && Math.abs(p.value - average) > std)
    .map((p) => ({
      label: p.label,
      value: p.value,
      reason:
        p.value > average
          ? `well above the ${ds.dimension.toLowerCase()} average`
          : `well below the ${ds.dimension.toLowerCase()} average`,
    }))
    .sort((a, b) => Math.abs(b.value - average) - Math.abs(a.value - average));

  const largest = points[0];
  const smallest = points[points.length - 1];

  return {
    mode: "single",
    datasetId: ds.id,
    name: ds.name,
    metric: ds.metric,
    dimension: ds.dimension,
    unit: ds.unit,
    currencyCode: ds.currencyCode,
    aggregation: ds.aggregation ?? "sum",
    total,
    points,
    largest: { label: largest.label, value: largest.value, share: largest.share },
    smallest: { label: smallest.label, value: smallest.value },
    average,
    outliers,
    concentration: {
      topShare: largest.share,
      note:
        largest.share > 35
          ? `${largest.label} alone is ${largest.share}% of the total — heavily concentrated.`
          : `No single ${ds.dimension.toLowerCase()} dominates; the spread is fairly even.`,
    },
  };
}
