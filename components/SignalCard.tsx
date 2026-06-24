'use client'

import type { CSSProperties } from 'react'
import type { KommuneSignal, SignalTier } from '@/lib/sundhedsradar.types'
import { SourceChip } from './SourceChip'

export interface SignalCardProps {
  signal: KommuneSignal
  index: number
  onSelect?: (kommuneKode: string) => void
  isSelected?: boolean
}

// ── tier tokens ────────────────────────────────────────────────────
const TIER_BADGE: Record<SignalTier, string> = {
  Rolig:    'bg-[#e6f4e6] text-[#1a5c1a]',
  Forhøjet: 'bg-[#e6eeff] text-[var(--color-machine)]',
  Høj:      'bg-[#fde8e4] text-[var(--color-human)]',
}

const TIER_SCORE_COLOR: Record<SignalTier, string> = {
  Rolig:    '#1a5c1a',
  Forhøjet: 'var(--color-machine)',
  Høj:      'var(--color-human)',
}

const TIER_STROKE: Record<SignalTier, string> = {
  Rolig:    '#22c55e',
  Forhøjet: '#0082f3',
  Høj:      '#f04b1e',
}

// ── sparkline utils ────────────────────────────────────────────────
// Derives a plausible 8-point 4-week trend from kommuneKode seed + score.
// KommuneSignal carries no historical array, so we synthesise a deterministic
// one so the animation still plays faithfully to the prototype.
function derivedSparkline(kode: string, score: number): number[] {
  const seed = parseInt(kode, 10)
  const base = score * 100
  return Array.from({ length: 8 }, (_, i) => {
    const noise = Math.sin(seed * 1.3 + i * 2.7) * 7
    const trend = ((i / 7) - 0.3) * base * 0.35
    return Math.max(5, Math.min(100, base * 0.65 + trend + noise))
  })
}

function sparklinePoints(vals: number[], W = 200, H = 38): string {
  const lo = Math.min(...vals), hi = Math.max(...vals), r = hi - lo || 1
  return vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * W
      const y = H - ((v - lo) / r) * (H - 5) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function polylineLength(pts: string): number {
  const pairs = pts.trim().split(' ').map(s => s.split(',').map(Number))
  let len = 0
  for (let i = 1; i < pairs.length; i++) {
    const dx = pairs[i][0] - pairs[i - 1][0]
    const dy = pairs[i][1] - pairs[i - 1][1]
    len += Math.sqrt(dx * dx + dy * dy)
  }
  return Math.ceil(len) + 4
}

function fillPoly(pts: string, H = 38): string {
  const p = pts.trim().split(' ')
  const lastX = p[p.length - 1].split(',')[0]
  const firstX = p[0].split(',')[0]
  return `${pts} ${lastX},${H} ${firstX},${H}`
}

function wwLabel(n: number): string {
  return (['—', '●', '● ●', '● ● ●'] as const)[n] ?? '—'
}

// ── component ──────────────────────────────────────────────────────
export function SignalCard({ signal, index, onSelect, isSelected = false }: SignalCardProps) {
  const {
    kommuneKode, kommuneNavn, tier, compositeScore,
    components, wastewaterScore, dmiMeanTempC, sourcesUsed,
  } = signal

  const sparkVals = derivedSparkline(kommuneKode, compositeScore)
  const pts       = sparklinePoints(sparkVals)
  const len       = polylineLength(pts)
  const stroke    = TIER_STROKE[tier]
  const fp        = fillPoly(pts)

  const score    = Math.round(compositeScore * 100)
  const wwPct    = (wastewaterScore / 3) * 100
  const vulnPct  = components.vulnerabilityIndex * 100
  const tempC    = dmiMeanTempC ?? 12
  const weatherPct = Math.min(100, Math.max(0, ((5 - tempC) / 15) * 100))

  const SOURCE_TABLE: Partial<Record<string, string>> = {
    SSI:  'Spildevand',
    DST:  'FOLK1A',
    DMI:  'Vejr',
    DAWA: 'DAWA',
  }
  const SOURCE_VALUE: Partial<Record<string, string>> = {
    SSI:  `${wastewaterScore}/3`,
    DST:  `${Math.round(vulnPct)}% sårbare`,
    DMI:  `${tempC} °C`,
  }

  const chipSources = sourcesUsed.filter(s => s !== 'DAWA') as ('SSI' | 'DST' | 'DMI')[]

  function handleActivate() { onSelect?.(kommuneKode) }

  return (
    <article
      className={[
        'signal-card-enter overflow-hidden rounded-xl border cursor-pointer',
        'bg-paper transition-[box-shadow,transform] duration-200',
        'hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(0,0,0,0.11)]',
        'focus-visible:outline-2 focus-visible:outline-[var(--color-machine)] focus-visible:outline-offset-2',
        'motion-reduce:translate-y-0 motion-reduce:transition-[box-shadow]',
        isSelected
          ? 'shadow-[0_0_0_2px_var(--color-machine),0_6px_28px_rgba(0,0,0,0.14)] border-transparent'
          : 'border-[var(--color-border)]',
      ].join(' ')}
      style={{ '--card-index': index } as CSSProperties}
      tabIndex={0}
      role="listitem"
      aria-label={`${kommuneNavn}: ${tier} risiko, samlet signal ${score}`}
      onClick={handleActivate}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleActivate() }
      }}
    >
      {/* Brand gradient top bar */}
      <div className="brand-gradient-rule" aria-hidden="true" />

      <div className="p-4">
        {/* Top row: name + tier badge */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <h2
            className="text-[18px] font-bold tracking-[-0.02em] leading-[1.15]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {kommuneNavn}
          </h2>
          <span
            className={[
              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.02em] whitespace-nowrap shrink-0',
              TIER_BADGE[tier],
              tier === 'Høj' ? 'step-active' : '',
            ].join(' ')}
            aria-label={`Risikoniveau: ${tier}`}
          >
            {tier}
          </span>
        </div>

        {/* Composite score */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span
            className="text-[34px] font-bold tracking-[-0.03em] leading-none tabular-nums"
            style={{ fontFamily: 'var(--font-display)', color: TIER_SCORE_COLOR[tier] }}
          >
            {score}
          </span>
          <span className="text-[11px] text-[var(--color-muted)] font-medium">/ 100 samlet signal</span>
        </div>

        {/* Animated sparkline */}
        <div className="mb-3">
          <p className="text-[11px] text-[var(--color-muted)] mb-1">4-ugers trend</p>
          <svg
            viewBox="0 0 200 38"
            className="w-full"
            style={{ height: 42, overflow: 'visible', display: 'block' }}
            aria-hidden="true"
          >
            <polygon points={fp} fill={stroke} opacity="0.08" />
            <polyline
              className="sparkline-path"
              points={pts}
              stroke={stroke}
              fill="none"
              style={{ '--sparkline-length': len, '--card-index': index } as CSSProperties}
            />
          </svg>
        </div>

        {/* Key-factor bars */}
        <div className="flex flex-col gap-1.5 mb-3" aria-label="Nøglefaktorer">
          <FactorRow label="Spildevand" pct={wwPct} color="#0082f3"
            ariaLabel={`Spildevand ${wastewaterScore}/3`} valueTxt={wwLabel(wastewaterScore)} />
          <FactorRow label="Sårbarhed" pct={vulnPct} color="#6a5cff"
            ariaLabel={`Sårbarhed ${Math.round(vulnPct)}%`} valueTxt={`${Math.round(vulnPct)}%`} />
          <FactorRow label="Vejr" pct={weatherPct} color="#64748b"
            ariaLabel={`Vejrfaktor ${tempC}°C`} valueTxt={`${tempC}°`} />
        </div>

        {/* Source chips */}
        <div className="flex flex-wrap gap-1" aria-label="Datakilder">
          {chipSources.map((src, ci) => (
            <SourceChip
              key={src}
              source={src}
              table={SOURCE_TABLE[src] ?? src}
              kommuneKode={kommuneKode}
              field={src}
              value={SOURCE_VALUE[src] ?? ''}
              chipIndex={ci}
            />
          ))}
        </div>
      </div>
    </article>
  )
}

// ── small internal sub-component ──────────────────────────────────
function FactorRow({
  label, pct, color, ariaLabel, valueTxt,
}: {
  label: string
  pct: number
  color: string
  ariaLabel: string
  valueTxt: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--color-muted)] font-medium w-[68px] shrink-0">{label}</span>
      <div
        className="flex-1 h-1 bg-[#eeeeed] rounded-full overflow-hidden"
        role="meter"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] text-[var(--color-muted)] w-6 text-right shrink-0" aria-hidden="true">
        {valueTxt}
      </span>
    </div>
  )
}
