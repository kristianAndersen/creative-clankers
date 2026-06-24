// Pure CSV → Dataset logic, kept out of the UI so it's testable.
// Strategy: a label column (mostly text) + two numeric columns (previous, current).
// We auto-detect a sensible default mapping; the user can override it.

import type { Dataset, DataPoint } from "./datasets";

export const MAX_ROWS = 40;

export type ParsedTable = {
  headers: string[];
  rows: string[][];
};

export function parseNumber(raw: string): number | null {
  if (raw == null) return null;
  // Strip currency symbols, spaces, thousands separators and %; keep digits, . and -
  const cleaned = String(raw)
    .trim()
    .replace(/[%\s]/g, "")
    .replace(/[^0-9.,-]/g, "")
    .replace(/,(?=\d{3}\b)/g, ""); // comma as thousands separator
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned.replace(/,/g, "."));
  return Number.isFinite(n) ? n : null;
}

function columnNumericRatio(rows: string[][], col: number): number {
  if (rows.length === 0) return 0;
  let numeric = 0;
  for (const r of rows) {
    if (parseNumber(r[col] ?? "") !== null) numeric++;
  }
  return numeric / rows.length;
}

export type Detection = {
  labelCol: number;
  prevCol: number;
  curCol: number;
  numericCols: number[];
};

// Label = first column that's mostly non-numeric. The two numeric columns are
// taken in file order as previous → current (the common "before, after" layout).
export function detectColumns(table: ParsedTable): Detection {
  const colCount = table.headers.length;
  const numericCols: number[] = [];
  let labelCol = 0;
  let labelFound = false;

  for (let c = 0; c < colCount; c++) {
    const ratio = columnNumericRatio(table.rows, c);
    if (ratio >= 0.6) {
      numericCols.push(c);
    } else if (!labelFound) {
      labelCol = c;
      labelFound = true;
    }
  }

  if (!labelFound && colCount > 0) labelCol = 0;
  const prevCol = numericCols[0] ?? Math.min(1, colCount - 1);
  const curCol = numericCols[1] ?? numericCols[0] ?? Math.min(2, colCount - 1);

  return { labelCol, prevCol, curCol, numericCols };
}

export type BuildOptions = {
  table: ParsedTable;
  labelCol: number;
  mode?: "compare" | "single";
  // compare mode
  prevCol?: number;
  curCol?: number;
  // single mode
  metricCol?: number;
  aggregation?: "sum" | "average";
  // shared meta
  name?: string;
  metric?: string;
  dimension?: string;
  unit?: "currency" | "count";
  currencyCode?: string;
  goodDirection?: "up" | "down";
  period?: string;
};

export type BuildResult = {
  dataset: Dataset;
  skipped: number;
  truncated: boolean;
  grouped: number; // how many rows were merged into shared labels
};

// Group by label and aggregate — a records table (many rows per category)
// becomes a meaningful per-category breakdown, and labels are unique by
// construction (which also fixes duplicate React keys downstream).
export function buildDataset(opts: BuildOptions): BuildResult {
  const mode = opts.mode ?? "compare";
  return mode === "single" ? buildSingle(opts) : buildCompare(opts);
}

function finish(
  opts: BuildOptions,
  order: string[],
  groups: Map<string, DataPoint>,
  validRows: number,
  skipped: number,
  mode: "compare" | "single",
): BuildResult {
  const all = order.map((l) => groups.get(l)!);
  const grouped = validRows - all.length;
  all.sort((a, b) => b.current - a.current);
  const truncated = all.length > MAX_ROWS;
  const points = all.slice(0, MAX_ROWS);

  const labelHeader = opts.table.headers[opts.labelCol];
  const metricHeader =
    opts.table.headers[mode === "single" ? opts.metricCol ?? 0 : opts.curCol ?? 0];

  const dataset: Dataset = {
    id: "uploaded",
    name: opts.name?.trim() || "Your dataset",
    blurb: "Uploaded by you.",
    dimension: opts.dimension?.trim() || labelHeader || "Item",
    metric: opts.metric?.trim() || metricHeader || "Value",
    unit: opts.unit ?? "count",
    currencyCode: opts.currencyCode,
    period:
      opts.period?.trim() || (mode === "single" ? "Snapshot" : "Current vs previous"),
    goodDirection: opts.goodDirection ?? "up",
    mode,
    aggregation: mode === "single" ? opts.aggregation ?? "sum" : undefined,
    points,
  };

  return { dataset, skipped, truncated, grouped };
}

function buildCompare(opts: BuildOptions): BuildResult {
  const { table, labelCol, prevCol = 1, curCol = 2 } = opts;
  const groups = new Map<string, DataPoint>();
  const order: string[] = [];
  let skipped = 0;
  let validRows = 0;

  for (const r of table.rows) {
    const label = (r[labelCol] ?? "").trim();
    const previous = parseNumber(r[prevCol] ?? "");
    const current = parseNumber(r[curCol] ?? "");
    if (!label || previous === null || current === null) {
      skipped++;
      continue;
    }
    validRows++;
    const existing = groups.get(label);
    if (existing) {
      existing.previous = (existing.previous ?? 0) + previous;
      existing.current += current;
    } else {
      groups.set(label, { label, previous, current });
      order.push(label);
    }
  }

  return finish(opts, order, groups, validRows, skipped, "compare");
}

function buildSingle(opts: BuildOptions): BuildResult {
  const { table, labelCol, metricCol = 1, aggregation = "sum" } = opts;
  const groups = new Map<string, DataPoint>();
  const counts = new Map<string, number>();
  const order: string[] = [];
  let skipped = 0;
  let validRows = 0;

  for (const r of table.rows) {
    const label = (r[labelCol] ?? "").trim();
    const value = parseNumber(r[metricCol] ?? "");
    if (!label || value === null) {
      skipped++;
      continue;
    }
    validRows++;
    const existing = groups.get(label);
    if (existing) {
      existing.current += value;
      counts.set(label, (counts.get(label) ?? 1) + 1);
    } else {
      groups.set(label, { label, current: value });
      counts.set(label, 1);
      order.push(label);
    }
  }

  if (aggregation === "average") {
    for (const [label, pt] of groups) {
      const n = counts.get(label) ?? 1;
      pt.current = Math.round((pt.current / n) * 100) / 100;
    }
  }

  return finish(opts, order, groups, validRows, skipped, "single");
}
