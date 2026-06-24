import type { Analysis } from "@/lib/analyze";
import { formatValue, formatPct } from "@/lib/format";
import { Chart } from "./Chart";

// The generative-UI surface: when the agent's analyze tool returns, this
// renders the result as a designed deliverable rather than a wall of text.
// Adapts to both analysis shapes.

export function AnalysisPanel({ analysis }: { analysis: Analysis }) {
  return (
    <div className="rise-in overflow-hidden rounded-xl border border-grey-4 bg-paper">
      <div className="brand-gradient-rule" />

      {/* header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-grey-5 px-5 py-4">
        <div>
          <h3
            className="text-lg tracking-tight text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {analysis.name}
          </h3>
          <p className="text-xs uppercase tracking-[0.16em] text-grey-2">
            {analysis.metric} by {analysis.dimension} ·{" "}
            {analysis.mode === "single"
              ? `${analysis.aggregation} · snapshot`
              : analysis.period}
          </p>
        </div>
        <span className="rounded-full bg-cream px-2.5 py-1 text-xs text-grey-2">
          computed in code · not generated
        </span>
      </div>

      {/* KPIs */}
      {analysis.mode === "single" ? (
        <SingleKpis analysis={analysis} />
      ) : (
        <CompareKpis analysis={analysis} />
      )}

      {/* chart */}
      <div className="px-5 py-5">
        <Chart analysis={analysis} />
      </div>

      {/* outliers + concentration */}
      <div className="space-y-2 border-t border-grey-5 px-5 py-4">
        {analysis.mode === "single"
          ? analysis.outliers.map((o, oi) => (
              <p key={`${o.label}-${oi}`} className="flex gap-2 text-sm text-ink-soft">
                <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-human" />
                <span>
                  <span className="font-medium text-ink">{o.label}</span> stands out
                  at {formatValue(o.value, analysis.unit, analysis.currencyCode)} — {o.reason}.
                </span>
              </p>
            ))
          : analysis.outliers.map((o, oi) => (
              <p key={`${o.label}-${oi}`} className="flex gap-2 text-sm text-ink-soft">
                <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-human" />
                <span>
                  <span className="font-medium text-ink">{o.label}</span> is an
                  outlier ({formatPct(o.growthPct)}) — {o.reason}.
                </span>
              </p>
            ))}
        <p className="flex gap-2 text-sm text-grey-2">
          <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-machine" />
          {analysis.concentration.note}
        </p>
      </div>
    </div>
  );
}

function CompareKpis({
  analysis,
}: {
  analysis: Extract<Analysis, { mode: "compare" }>;
}) {
  const t = analysis.totals;
  const totalIsGood =
    analysis.goodDirection === "up" ? t.growthPct >= 0 : t.growthPct <= 0;
  return (
    <div className="grid grid-cols-2 gap-px bg-grey-5 sm:grid-cols-4">
      <Kpi
        label="Total, this period"
        value={formatValue(t.current, analysis.unit, analysis.currencyCode)}
      />
      <Kpi
        label="Period-over-period"
        value={formatPct(t.growthPct)}
        tone={totalIsGood ? "neutral" : "human"}
      />
      <Kpi
        label="Biggest mover"
        value={analysis.topGrower.label}
        sub={formatPct(analysis.topGrower.growthPct)}
      />
      <Kpi
        label={`Largest ${analysis.dimension.toLowerCase()}`}
        value={analysis.biggestContributor.label}
        sub={`${analysis.biggestContributor.shareOfCurrent}% of total`}
      />
    </div>
  );
}

function SingleKpis({
  analysis,
}: {
  analysis: Extract<Analysis, { mode: "single" }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-px bg-grey-5 sm:grid-cols-4">
      <Kpi
        label={`Largest ${analysis.dimension.toLowerCase()}`}
        value={analysis.largest.label}
        sub={formatValue(analysis.largest.value, analysis.unit, analysis.currencyCode)}
      />
      <Kpi label="Its share" value={`${analysis.largest.share}%`} tone="human" />
      <Kpi
        label={`Average ${analysis.aggregation === "average" ? "" : "per " + analysis.dimension.toLowerCase()}`.trim()}
        value={formatValue(analysis.average, analysis.unit, analysis.currencyCode)}
      />
      <Kpi
        label={`${analysis.dimension}s ranked`}
        value={String(analysis.points.length)}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "human";
}) {
  return (
    <div className="bg-paper px-4 py-3.5">
      <p className="text-[0.68rem] uppercase tracking-[0.12em] text-grey-2">
        {label}
      </p>
      <p
        className="mt-1 truncate text-xl tabular-nums tracking-tight"
        style={{
          fontFamily: "var(--font-display)",
          color: tone === "human" ? "var(--color-human)" : "var(--color-ink)",
        }}
        title={value}
      >
        {value}
      </p>
      {sub && <p className="text-xs tabular-nums text-grey-2">{sub}</p>}
    </div>
  );
}
