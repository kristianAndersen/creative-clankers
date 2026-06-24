'use client'

import { useState, useMemo } from 'react'
import type { KommuneSignal, SignalTier } from '@/lib/sundhedsradar.types'
import { SignalCard } from './SignalCard'

export interface SignalPanelProps {
  signals: KommuneSignal[]
  onSelect: (kommuneKode: string) => void
}

type TierFilter = 'all' | SignalTier
type SortKey = 'score-desc' | 'score-asc' | 'navn'

const TIER_FILTERS: { key: TierFilter; label: string; color?: string }[] = [
  { key: 'all',      label: 'Alle' },
  { key: 'Rolig',    label: 'Rolig',    color: '#1a5c1a' },
  { key: 'Forhøjet', label: 'Forhøjet', color: 'var(--color-machine)' },
  { key: 'Høj',      label: 'Høj',      color: 'var(--color-human)' },
]

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'score-desc', label: 'Score ↓' },
  { value: 'score-asc',  label: 'Score ↑' },
  { value: 'navn',       label: 'Navn A–Å' },
]

export function SignalPanel({ signals, onSelect }: SignalPanelProps) {
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [sort, setSort] = useState<SortKey>('score-desc')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = tierFilter === 'all' ? [...signals] : signals.filter(s => s.tier === tierFilter)
    if (sort === 'score-desc') list.sort((a, b) => b.compositeScore - a.compositeScore)
    else if (sort === 'score-asc') list.sort((a, b) => a.compositeScore - b.compositeScore)
    else list.sort((a, b) => a.kommuneNavn.localeCompare(b.kommuneNavn, 'da'))
    return list
  }, [signals, tierFilter, sort])

  function handleSelect(kode: string) {
    setSelected(kode)
    onSelect(kode)
  }

  // Derive week/year label from first signal
  const weekLabel = signals[0]
    ? `Uge ${signals[0].week}, ${signals[0].year}`
    : null

  return (
    <section aria-label="Kommuners sundhedsstatus">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2
            className="text-[clamp(18px,2.5vw,24px)] font-bold tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Ugentlig sundhedsradar
          </h2>
          <p className="text-[13px] text-[var(--color-muted)] mt-0.5">
            Viser {filtered.length} kommuner
            {weekLabel ? ` · ${weekLabel}` : ''}
            {' '}· Klik en kommune for detaljer og 5-årig historik
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tier filter pills */}
          <div
            className="flex items-center gap-1.5 flex-wrap"
            role="group"
            aria-label="Filtrer risikoniveau"
          >
            <span className="text-[11px] text-[var(--color-muted)] font-medium">Vis:</span>
            {TIER_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setTierFilter(f.key)}
                aria-pressed={tierFilter === f.key}
                style={f.color ? { color: f.color } : undefined}
                className={[
                  'rounded-full border border-[var(--color-border)] px-2.5 py-0.5',
                  'text-[12px] font-medium transition-colors duration-150',
                  'hover:border-[var(--color-ink)]',
                  tierFilter === f.key
                    ? 'bg-[var(--color-ink)] !text-white border-[var(--color-ink)]'
                    : 'bg-transparent text-[var(--color-ink)]',
                ].join(' ')}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            aria-label="Sortér"
            className="rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1 text-[12px] text-[var(--color-ink)] cursor-pointer"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[var(--color-muted)]" role="status">
          <p className="text-3xl mb-2">🌤️</p>
          <strong className="block text-[13px]">Ingen kommuner matcher filteret</strong>
          <p className="text-[13px] mt-1">Prøv et andet risikoniveau</p>
        </div>
      ) : (
        <div
          className="grid gap-[clamp(10px,2vw,18px)]"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px,100%), 1fr))' }}
          role="list"
        >
          {filtered.map((signal, i) => (
            <SignalCard
              key={signal.kommuneKode}
              signal={signal}
              index={i}
              onSelect={handleSelect}
              isSelected={selected === signal.kommuneKode}
            />
          ))}
        </div>
      )}
    </section>
  )
}
