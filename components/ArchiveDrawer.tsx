'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { ArchiveEntry, SignalTier } from '@/lib/sundhedsradar.types'

export interface ArchiveDrawerProps {
  kommuneKode: string
  navn: string
  entries: ArchiveEntry[]
  isOpen: boolean
  onClose: () => void
}

// ── chart constants ───────────────────────────────────────────────
const CHART_W  = 440
const CHART_H  = 170
const PX       = 18
const PY       = 12
const LABEL_H  = 14
const INNER_W  = CHART_W - PX * 2
const INNER_H  = CHART_H - PY * 2 - LABEL_H

const YEARS        = [2021, 2022, 2023, 2024, 2025] as const
const WEEKS_PER_YEAR = 52
const N            = YEARS.length * WEEKS_PER_YEAR  // 260

const TIER_LEVEL: Record<SignalTier, number> = {
  Rolig:    0.2,
  Forhøjet: 0.55,
  Høj:      1.0,
}

const PATHOGEN_COLOR = {
  covid19:   '#0082f3',
  influenza: '#f04b1e',
  rsv:       '#22c55e',
} as const

// ── chart data ────────────────────────────────────────────────────
interface StackedPoint {
  weekIndex: number
  c:   number   // covid cumulative
  cf:  number   // covid + flu
  cfr: number   // covid + flu + rsv
}

function buildStackedPoints(entries: ArchiveEntry[]): StackedPoint[] {
  // Map (year, week, pathogen) → tier level
  const lookup = new Map<string, number>()
  for (const e of entries) {
    if (!(YEARS as readonly number[]).includes(e.year)) continue
    const key = `${e.year}-${e.week}-${e.pathogen}`
    const cur = lookup.get(key) ?? 0
    lookup.set(key, Math.max(cur, TIER_LEVEL[e.nationalTier]))
  }

  return Array.from({ length: N }, (_, wi) => {
    const yearIdx = Math.floor(wi / WEEKS_PER_YEAR)
    const week    = (wi % WEEKS_PER_YEAR) + 1
    const year    = YEARS[yearIdx]
    const covid   = lookup.get(`${year}-${week}-covid19`)   ?? 0
    const flu     = lookup.get(`${year}-${week}-influenza`) ?? 0
    const rsv     = lookup.get(`${year}-${week}-rsv`)       ?? 0
    return { weekIndex: wi, c: covid, cf: covid + flu, cfr: covid + flu + rsv }
  })
}

// ── svg geometry helpers ──────────────────────────────────────────
function xOfIndex(i: number) { return PX + (i / (N - 1)) * INNER_W }
function yOfVal(v: number, maxY: number) {
  return PY + INNER_H - (v / maxY) * INNER_H
}

function polylineStr(vals: number[], maxY: number): string {
  return vals.map((v, i) => `${xOfIndex(i).toFixed(1)},${yOfVal(v, maxY).toFixed(1)}`).join(' ')
}

function areaStr(lower: number[], upper: number[], maxY: number): string {
  const fwd = upper.map((v, i) => `${xOfIndex(i).toFixed(1)},${yOfVal(v, maxY).toFixed(1)}`).join(' ')
  const rev = [...lower]
    .reverse()
    .map((_v, i) => {
      const ri = lower.length - 1 - i
      return `${xOfIndex(ri).toFixed(1)},${yOfVal(lower[ri], maxY).toFixed(1)}`
    })
    .join(' ')
  return `${fwd} ${rev}`
}

// ── sub-components ────────────────────────────────────────────────
function ArchiveChart({ entries }: { entries: ArchiveEntry[] }) {
  const [hoverYear, setHoverYear] = useState<number | null>(null)

  const pts  = buildStackedPoints(entries)
  const zeros = Array<number>(N).fill(0)
  const cs    = pts.map(p => p.c)
  const cfs   = pts.map(p => p.cf)
  const cfrs  = pts.map(p => p.cfr)
  const maxY  = Math.max(...cfrs, 0.5)

  const yearX = (yi: number) => PX + (yi * WEEKS_PER_YEAR / (N - 1)) * INNER_W

  return (
    <div className="relative">
      <div className="rounded-lg overflow-hidden bg-[#fafaf9]">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          style={{ height: 170, display: 'block' }}
          role="img"
          aria-label="5-årig stacked area chart: covid19, influenza, RSV"
          preserveAspectRatio="none"
        >
          {/* Background */}
          <rect x={PX} y={PY} width={INNER_W} height={INNER_H} fill="#fafaf9" rx="4" />

          {/* Year dividers */}
          {YEARS.map((yr, yi) =>
            yi > 0 ? (
              <line
                key={yr}
                x1={yearX(yi).toFixed(1)} y1={PY}
                x2={yearX(yi).toFixed(1)} y2={PY + INNER_H}
                stroke="#e0e0dc" strokeWidth="0.8" strokeDasharray="3,3"
              />
            ) : null,
          )}

          {/* Stacked areas */}
          <polygon
            points={areaStr(zeros, cs, maxY)}
            fill={PATHOGEN_COLOR.covid19}
            opacity="0.35"
          />
          <polyline
            points={polylineStr(cs, maxY)}
            fill="none"
            stroke={PATHOGEN_COLOR.covid19}
            strokeWidth="1"
            opacity="0.7"
          />

          <polygon
            points={areaStr(cs, cfs, maxY)}
            fill={PATHOGEN_COLOR.influenza}
            opacity="0.30"
          />
          <polyline
            points={polylineStr(cfs, maxY)}
            fill="none"
            stroke={PATHOGEN_COLOR.influenza}
            strokeWidth="1"
            opacity="0.65"
          />

          <polygon
            points={areaStr(cfs, cfrs, maxY)}
            fill={PATHOGEN_COLOR.rsv}
            opacity="0.28"
          />
          <polyline
            points={polylineStr(cfrs, maxY)}
            fill="none"
            stroke={PATHOGEN_COLOR.rsv}
            strokeWidth="1"
            opacity="0.6"
          />

          {/* Year hover zones (invisible hit targets) */}
          {YEARS.map((yr, yi) => {
            const x1 = yi === 0 ? PX : yearX(yi)
            const x2 = yi === YEARS.length - 1 ? PX + INNER_W : yearX(yi + 1)
            return (
              <rect
                key={yr}
                x={x1} y={PY}
                width={x2 - x1} height={INNER_H}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverYear(yr)}
                onMouseLeave={() => setHoverYear(null)}
              />
            )
          })}

          {/* Year labels */}
          {YEARS.map((yr, yi) => (
            <text
              key={yr}
              x={(yearX(yi) + (yi < YEARS.length - 1 ? yearX(yi + 1) : PX + INNER_W)) / 2}
              y={PY + INNER_H + 11}
              textAnchor="middle"
              fontSize="9"
              fill="#9ca3af"
            >
              {yr}
            </text>
          ))}
        </svg>
      </div>

      {/* "Hvad skete der her?" tooltip */}
      {hoverYear !== null && (
        <div
          className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-[11px] font-medium text-white shadow-lg whitespace-nowrap z-10"
          aria-hidden="true"
        >
          {hoverYear}: Hvad skete der her?
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-3.5 mt-2 flex-wrap">
        {(
          [
            ['covid19',   'COVID-19'],
            ['influenza', 'Influenza'],
            ['rsv',       'RSV'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: PATHOGEN_COLOR[key] }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────
export function ArchiveDrawer({ navn, entries, isOpen, onClose }: ArchiveDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Trap focus into drawer when opened; restore on close
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => closeRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Keyboard close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Overlay */}
      <div
        className={[
          'fixed inset-0 z-[200] transition-opacity duration-300 motion-reduce:transition-none',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        style={{ background: 'rgba(17,17,17,0.38)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={[
          'fixed inset-y-0 right-0 z-[201] w-[min(480px,100vw)] overflow-y-auto',
          'bg-paper shadow-[-8px_0_48px_rgba(0,0,0,0.14)]',
          'transition-transform duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          'motion-reduce:transition-none',
          isOpen ? 'translate-x-0 archive-drawer-open' : 'translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-modal={true}
        aria-hidden={!isOpen}
        aria-labelledby="archive-drawer-title"
        tabIndex={-1}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-paper border-b border-[var(--color-border)] px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="archive-drawer-title"
              className="text-[16px] font-bold tracking-[-0.02em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {navn} · Arkiv
            </h2>
            <p className="text-[12px] text-[var(--color-muted)] mt-0.5">
              Hvad skete der her? · 5-årig historik
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Luk arkiv"
            className="h-8 w-8 shrink-0 rounded-lg border border-[var(--color-border)] bg-transparent flex items-center justify-center text-[19px] leading-none text-[var(--color-muted)] hover:bg-[#f5f5f2] transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">

          {/* Stacked-area chart */}
          <section aria-label="Nationalt signalniveau 2021–2025">
            <h3 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--color-muted)] mb-2.5">
              Nationalt signalniveau 2021–2025
            </h3>
            {entries.length === 0 ? (
              <div className="rounded-lg bg-[#fafaf9] p-8 text-center text-[13px] text-[var(--color-muted)]">
                Ingen arkivdata tilgængelig
              </div>
            ) : (
              <ArchiveChart entries={entries} />
            )}
          </section>

          {/* Source chips */}
          <section aria-label="Datakilder">
            <h3 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--color-muted)] mb-2.5">
              Datakilder
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { cls: 'bg-green-50 text-green-800 border-green-200', label: 'SSI Spildevand',  ci: 0 },
                  { cls: 'bg-blue-50 text-blue-700 border-blue-200',   label: 'DST FOLK1A',       ci: 1 },
                  { cls: 'bg-blue-50 text-blue-700 border-blue-200',   label: 'DST MEDI1',        ci: 2 },
                  { cls: 'bg-slate-50 text-slate-600 border-slate-300', label: 'DMI Vejr',        ci: 3 },
                ] as const
              ).map(({ cls, label, ci }) => (
                <span
                  key={label}
                  className={`lock-pulse inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.01em] ${cls}`}
                  style={{ '--chip-index': ci } as CSSProperties}
                >
                  🔒 {label}
                </span>
              ))}
            </div>
          </section>

        </div>
      </aside>
    </>
  )
}
