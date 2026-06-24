import type { Analysis } from "@/lib/analyze";
import { formatValue, formatPct } from "@/lib/format";

// Bespoke horizontal bar chart, hand-drawn in SVG/CSS for full control of the
// craft. Two modes: a current-vs-previous comparison, or a single-metric rank.

export function Chart({ analysis }: { analysis: Analysis }) {
  return analysis.mode === "single" ? (
    <SingleChart analysis={analysis} />
  ) : (
    <CompareChart analysis={analysis} />
  );
}

function BarLabel({ text }: { text: string }) {
  return (
    <span className="truncate text-sm text-ink-soft" title={text}>
      {text}
    </span>
  );
}

function CompareChart({
  analysis,
}: {
  analysis: Extract<Analysis, { mode: "compare" }>;
}) {
  const { points, unit, currencyCode, goodDirection } = analysis;
  const max = Math.max(...points.map((p) => Math.max(p.current, p.previous)));

  return (
    <div className="space-y-3">
      {points.map((p, i) => {
        const curW = max === 0 ? 0 : (p.current / max) * 100;
        const prevW = max === 0 ? 0 : (p.previous / max) * 100;
        const isGood = goodDirection === "up" ? p.growthPct >= 0 : p.growthPct <= 0;
        const moved = Math.abs(p.growthPct) >= 0.05;

        return (
          <div
            key={`${p.label}-${i}`}
            className="rise-in grid grid-cols-[7.5rem_1fr_5.5rem] items-center gap-3"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <BarLabel text={p.label} />
            <div className="relative h-7">
              <div className="absolute inset-0 rounded-[3px] bg-grey-5" />
              <div
                className="absolute inset-y-0 left-0 rounded-[3px] transition-[width] duration-700 ease-out"
                style={{
                  width: `${curW}%`,
                  background:
                    "linear-gradient(90deg, var(--color-brand) 0%, var(--color-brand-bright) 100%)",
                }}
              />
              <div
                className="absolute inset-y-1 w-0.5 bg-ink/55"
                style={{ left: `calc(${prevW}% - 1px)` }}
                title={`Previous: ${formatValue(p.previous, unit, currencyCode)}`}
              />
              <span
                className="absolute inset-y-0 flex items-center text-xs font-medium"
                style={{
                  left: curW > 22 ? "0.5rem" : `calc(${curW}% + 0.4rem)`,
                  color: curW > 22 ? "var(--color-paper)" : "var(--color-ink)",
                }}
              >
                {formatValue(p.current, unit, currencyCode)}
              </span>
            </div>
            <span
              className="text-right text-sm font-medium tabular-nums"
              style={{
                color: !moved
                  ? "var(--color-grey-2)"
                  : isGood
                    ? "var(--color-ink)"
                    : "var(--color-human)",
              }}
            >
              {formatPct(p.growthPct)}
            </span>
          </div>
        );
      })}

      <div className="flex items-center gap-5 pt-2 text-xs text-grey-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-3 rounded-[2px] bg-machine" />
          Current
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-0.5 bg-ink/55" />
          Previous
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-human" />
          Against the goal
        </span>
      </div>
    </div>
  );
}

function SingleChart({
  analysis,
}: {
  analysis: Extract<Analysis, { mode: "single" }>;
}) {
  const { points, unit, currencyCode } = analysis;
  const max = Math.max(...points.map((p) => p.value), 0);

  return (
    <div className="space-y-3">
      {points.map((p, i) => {
        const w = max === 0 ? 0 : (p.value / max) * 100;
        return (
          <div
            key={`${p.label}-${i}`}
            className="rise-in grid grid-cols-[7.5rem_1fr_4rem] items-center gap-3"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <BarLabel text={p.label} />
            <div className="relative h-7">
              <div className="absolute inset-0 rounded-[3px] bg-grey-5" />
              <div
                className="absolute inset-y-0 left-0 rounded-[3px] transition-[width] duration-700 ease-out"
                style={{
                  width: `${w}%`,
                  background:
                    "linear-gradient(90deg, var(--color-brand) 0%, var(--color-brand-bright) 100%)",
                }}
              />
              <span
                className="absolute inset-y-0 flex items-center text-xs font-medium"
                style={{
                  left: w > 22 ? "0.5rem" : `calc(${w}% + 0.4rem)`,
                  color: w > 22 ? "var(--color-paper)" : "var(--color-ink)",
                }}
              >
                {formatValue(p.value, unit, currencyCode)}
              </span>
            </div>
            <span className="text-right text-sm font-medium tabular-nums text-grey-2">
              {p.share}%
            </span>
          </div>
        );
      })}

      <div className="flex items-center gap-5 pt-2 text-xs text-grey-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-3 rounded-[2px] bg-machine" />
          {analysis.metric}
        </span>
        <span>% = share of total</span>
      </div>
    </div>
  );
}
