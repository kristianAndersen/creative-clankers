"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import type { Dataset } from "@/lib/datasets";
import {
  buildDataset,
  detectColumns,
  MAX_ROWS,
  type ParsedTable,
} from "@/lib/csv";

export function Upload({
  onAnalyze,
  disabled,
}: {
  onAnalyze: (dataset: Dataset) => void;
  disabled: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  // mapping
  const [mode, setMode] = useState<"compare" | "single">("compare");
  const [labelCol, setLabelCol] = useState(0);
  const [prevCol, setPrevCol] = useState(1);
  const [curCol, setCurCol] = useState(2);
  const [metricCol, setMetricCol] = useState(1);
  const [aggregation, setAggregation] = useState<"sum" | "average">("sum");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<"count" | "currency">("count");
  const [goodDirection, setGoodDirection] = useState<"up" | "down">("up");

  function handleFile(file: File) {
    setError("");
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (res) => {
        const data = res.data.filter((r) => r.some((c) => c?.trim()));
        if (data.length < 2) {
          setError("That file needs a header row and at least one data row.");
          return;
        }
        const headers = data[0].map((h) => h.trim());
        const rows = data.slice(1);
        const t: ParsedTable = { headers, rows };
        const det = detectColumns(t);
        setTable(t);
        setLabelCol(det.labelCol);
        setPrevCol(det.prevCol);
        setCurCol(det.curCol);
        setMetricCol(det.prevCol);
        // A records table (labels repeat heavily) is usually single-metric.
        const dupHeavy =
          new Set(rows.map((r) => r[det.labelCol])).size < rows.length * 0.6;
        setMode(det.numericCols.length < 2 || dupHeavy ? "single" : "compare");
        setName(file.name.replace(/\.[^.]+$/, ""));
        setFileName(file.name);
      },
      error: () => setError("Couldn't read that file. Is it a valid CSV?"),
    });
  }

  function clear() {
    setTable(null);
    setFileName("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function run() {
    if (!table) return;
    setError("");
    const { dataset, skipped, truncated, grouped } = buildDataset({
      table,
      labelCol,
      mode,
      prevCol,
      curCol,
      metricCol,
      aggregation,
      name,
      unit,
      goodDirection,
    });
    if (dataset.points.length === 0) {
      setError(
        "No valid rows found with the chosen columns. Check the Label / Previous / Current selections.",
      );
      return;
    }
    const dim = dataset.dimension.toLowerCase();
    const parts: string[] = [];
    if (grouped > 0)
      parts.push(
        `Grouped ${grouped + dataset.points.length} rows into ${dataset.points.length} ${dim} (summed).`,
      );
    if (truncated) parts.push(`Showing the top ${MAX_ROWS}.`);
    if (skipped > 0) parts.push(`Skipped ${skipped} unreadable rows.`);
    setNote(parts.join(" "));
    onAnalyze(dataset);
  }

  const colOptions = (sel: number, set: (n: number) => void, id: string) => (
    <select
      aria-label={id}
      value={sel}
      onChange={(e) => set(Number(e.target.value))}
      className="rounded-md border border-grey-4 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-brand"
    >
      {table!.headers.map((h, i) => (
        <option key={i} value={i}>
          {h || `Column ${i + 1}`}
        </option>
      ))}
    </select>
  );

  if (!table) {
    return (
      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-grey-4 bg-cool px-4 py-5 text-sm text-grey-2 transition-colors hover:border-brand hover:text-ink disabled:opacity-50"
        >
          <span className="text-base">↑</span>
          Upload your own CSV — first text column = labels, two number columns = before &amp; after
        </button>
        {error && <p className="mt-2 text-sm text-human">{error}</p>}
      </div>
    );
  }

  const previewRows = table.rows.slice(0, 5);

  return (
    <div className="rounded-xl border border-grey-4 bg-paper p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="truncate text-sm font-medium text-ink" title={fileName}>
          {fileName}{" "}
          <span className="font-normal text-grey-3">
            · {table.rows.length} rows
          </span>
        </p>
        <button
          onClick={clear}
          className="text-xs text-grey-2 underline-offset-2 hover:text-ink hover:underline"
        >
          remove
        </button>
      </div>

      {/* preview */}
      <div className="mb-4 overflow-x-auto rounded-lg border border-grey-5">
        <table className="w-full text-left text-xs">
          <thead className="bg-cool text-grey-2">
            <tr>
              {table.headers.map((h, i) => (
                <th key={i} className="whitespace-nowrap px-3 py-2 font-medium">
                  {h || `Col ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((r, ri) => (
              <tr key={ri} className="border-t border-grey-5">
                {table.headers.map((_, ci) => (
                  <td key={ci} className="whitespace-nowrap px-3 py-1.5 text-ink-soft">
                    {r[ci]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mode toggle */}
      <div className="mb-3 inline-flex rounded-full border border-grey-4 p-0.5 text-xs">
        {(["compare", "single"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              mode === m ? "bg-ink text-cream" : "text-grey-2 hover:text-ink"
            }`}
          >
            {m === "compare" ? "Compare two periods" : "Rank one metric"}
          </button>
        ))}
      </div>

      {/* mapping */}
      {mode === "compare" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-grey-2">
            Group by (labels)
            {colOptions(labelCol, setLabelCol, "label column")}
          </label>
          <label className="flex flex-col gap-1 text-xs text-grey-2">
            Previous period
            {colOptions(prevCol, setPrevCol, "previous column")}
          </label>
          <label className="flex flex-col gap-1 text-xs text-grey-2">
            Current period
            {colOptions(curCol, setCurCol, "current column")}
          </label>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-grey-2">
            Group by (labels)
            {colOptions(labelCol, setLabelCol, "label column")}
          </label>
          <label className="flex flex-col gap-1 text-xs text-grey-2">
            Metric to rank
            {colOptions(metricCol, setMetricCol, "metric column")}
          </label>
          <label className="flex flex-col gap-1 text-xs text-grey-2">
            Aggregate by
            <select
              value={aggregation}
              onChange={(e) =>
                setAggregation(e.target.value as "sum" | "average")
              }
              className="rounded-md border border-grey-4 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-brand"
            >
              <option value="sum">Sum per group</option>
              <option value="average">Average per group</option>
            </select>
          </label>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-grey-2">
          Values are
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as "count" | "currency")}
            className="rounded-md border border-grey-4 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-brand"
          >
            <option value="count">Counts</option>
            <option value="currency">Currency (€)</option>
          </select>
        </label>
        {mode === "compare" && (
          <label className="flex flex-col gap-1 text-xs text-grey-2">
            Good direction
            <select
              value={goodDirection}
              onChange={(e) =>
                setGoodDirection(e.target.value as "up" | "down")
              }
              className="rounded-md border border-grey-4 bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-brand"
            >
              <option value="up">Up is good</option>
              <option value="down">Down is good</option>
            </select>
          </label>
        )}
        <button
          onClick={run}
          disabled={disabled}
          className="ml-auto rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          Analyze this dataset
        </button>
      </div>

      {table.rows.length > MAX_ROWS && (
        <p className="mt-2 text-xs text-grey-3">
          Note: only the first {MAX_ROWS} rows will be charted.
        </p>
      )}
      {note && <p className="mt-2 text-xs text-grey-2">{note}</p>}
      {error && <p className="mt-2 text-sm text-human">{error}</p>}
    </div>
  );
}
