'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { KommuneSignal, PlannerEvent, ArchiveEntry, SignalTier } from '@/lib/sundhedsradar.types'
import { SignalPanel } from '@/components/SignalPanel'
import { ArchiveDrawer } from '@/components/ArchiveDrawer'
import { SundhedsradarChat } from '@/components/SundhedsradarChat'
import { PlannerInput } from '@/components/PlannerInput'
import baselines from '@/data/ssi-seasonal-baselines.json'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function worstTier(signals: KommuneSignal[]): SignalTier {
  if (signals.some((s) => s.tier === 'Høj')) return 'Høj'
  if (signals.some((s) => s.tier === 'Forhøjet')) return 'Forhøjet'
  return 'Rolig'
}

function tierToClass(tier: SignalTier): string {
  if (tier === 'Høj') return 'sundhedsradar-page--hoej'
  if (tier === 'Forhøjet') return 'sundhedsradar-page--forhoejet'
  return 'sundhedsradar-page--rolig'
}

// Cast the imported baselines JSON to ArchiveEntry[] — structure is compatible.
const ARCHIVE_ENTRIES = baselines as unknown as ArchiveEntry[]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SundhedsradarPage() {
  const [signals, setSignals] = useState<KommuneSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [mode, setMode] = useState<'radar' | 'planner'>('radar')
  const [selectedKode, setSelectedKode] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [plannerEvent, setPlannerEvent] = useState<PlannerEvent | undefined>(undefined)

  // Derived: selected signal (from grid data)
  const selectedSignal = selectedKode
    ? (signals.find((s) => s.kommuneKode === selectedKode) ?? null)
    : null

  // Sky tier: selected signal's tier, or worst across all
  const skyTier: SignalTier =
    selectedSignal?.tier ?? (signals.length > 0 ? worstTier(signals) : 'Rolig')

  // Fetch all commune signals on mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFetchError(null)

    fetch('/api/sundhedsradar/data?kommuneKode=all')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<KommuneSignal[]>
      })
      .then((data) => {
        if (!cancelled) {
          setSignals(data)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : 'Ukendt fejl')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [])

  // When switching to planner mode, keep the selection but reset plannerEvent
  // so the chat doesn't show stale content.
  function handleModeSwitch(next: 'radar' | 'planner') {
    if (next === mode) return
    setPlannerEvent(undefined)
    setDrawerOpen(false)
    setMode(next)
  }

  // Card click — behaviour depends on mode
  function handleSignalSelect(kommuneKode: string) {
    setSelectedKode(kommuneKode)
    if (mode === 'radar') {
      setDrawerOpen(true)
    }
  }

  // PlannerInput submit → build minimal PlannerEvent and hand to chat
  function handlePlannerSubmit(text: string) {
    const event: PlannerEvent = {
      rawText: text,
      parsedDate: null,
      parsedKommuneKode: selectedKode,
      householdFlags: { hasInfant: false, hasElderly: false },
    }
    setPlannerEvent(event)
  }

  // Planner mode needs a signal — default to highest-score if none selected
  const plannerSignal =
    selectedSignal ??
    (signals.length > 0
      ? signals.reduce((a, b) => (b.compositeScore > a.compositeScore ? b : a))
      : null)

  // Archive entries for the drawer (national, static)
  const drawerNavn = selectedSignal?.kommuneNavn ?? ''

  return (
    <div
      className={`sundhedsradar-page ${tierToClass(skyTier)} min-h-screen transition-[background-color] duration-[1200ms] ease-[ease]`}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-[100] border-b border-[var(--color-border)] bg-paper">
        <div
          className="mx-auto flex h-[60px] max-w-[1400px] flex-wrap items-center gap-4 px-[clamp(14px,4vw,32px)]"
          style={{ flexWrap: 'nowrap' }}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-sm text-grey-2 transition-colors hover:text-ink"
          >
            <span
              className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[7px] text-[15px]"
              style={{ background: 'var(--brand-gradient)' }}
              aria-hidden="true"
            >
              🩺
            </span>
            <span
              className="text-[15px] font-bold tracking-[-0.02em] text-ink"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Sundhedsradar
            </span>
          </Link>

          <span className="flex-1" />

          {/* Mode toggle */}
          <div
            className="flex shrink-0 items-center gap-0.5 rounded-lg bg-[#f0f0eb] p-[3px]"
            role="group"
            aria-label="Vælg visning"
          >
            {(['radar', 'planner'] as const).map((m) => (
              <button
                key={m}
                onClick={() => handleModeSwitch(m)}
                aria-pressed={mode === m}
                className={[
                  'rounded-md px-[14px] py-[5px] text-[13px] font-medium transition-all duration-[180ms]',
                  mode === m
                    ? 'bg-paper text-ink shadow-sm'
                    : 'bg-transparent text-[var(--color-muted)]',
                ].join(' ')}
              >
                {m === 'radar' ? 'Radar' : 'Planlægger'}
              </button>
            ))}
          </div>

          <Link
            href="/"
            className="hidden shrink-0 text-xs uppercase tracking-[0.18em] text-grey-2 transition-colors hover:text-ink sm:block"
          >
            ← Creative Clankers
          </Link>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className="mx-auto max-w-[1400px] px-[clamp(14px,4vw,32px)] py-[clamp(20px,4vw,40px)]">

        {/* Loading skeleton */}
        {loading && (
          <div className="py-20 text-center text-sm text-[var(--color-muted)]">
            <span className="step-active inline-block h-2 w-2 rounded-full bg-human" />
            <span className="ml-2">Henter kommunedata…</span>
          </div>
        )}

        {/* Fetch error */}
        {fetchError && !loading && (
          <div className="rounded-lg border border-human/40 bg-blush px-5 py-4 text-sm text-human-deep">
            Kunne ikke hente sundhedsdata: {fetchError}
          </div>
        )}

        {/* Content when data is ready */}
        {!loading && !fetchError && (
          <>
            {/* ── RADAR MODE ───────────────────────────────────── */}
            {mode === 'radar' && (
              <>
                <SignalPanel signals={signals} onSelect={handleSignalSelect} />

                <ArchiveDrawer
                  kommuneKode={selectedKode ?? ''}
                  navn={drawerNavn}
                  entries={ARCHIVE_ENTRIES}
                  isOpen={drawerOpen}
                  onClose={() => setDrawerOpen(false)}
                />
              </>
            )}

            {/* ── PLANNER MODE ─────────────────────────────────── */}
            {mode === 'planner' && (
              <div className="space-y-8">
                {/* Signal selector — compact grid */}
                <section aria-label="Vælg kommune">
                  <h2
                    className="mb-1 text-[clamp(18px,2.5vw,24px)] font-bold tracking-[-0.02em]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Vælg din kommune
                  </h2>
                  <p className="mb-5 text-[13px] text-[var(--color-muted)]">
                    Klik på din kommune for at aktivere den personlige vejledning
                  </p>
                  <SignalPanel signals={signals} onSelect={handleSignalSelect} />
                </section>

                {/* Planner input + chat — only when a signal is available */}
                {plannerSignal && (
                  <section
                    aria-label="Planlæg begivenhed"
                    className="rounded-2xl border border-[var(--color-border)] bg-paper p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={[
                          'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                          plannerSignal.tier === 'Høj'
                            ? 'bg-[#fde8e4] text-human'
                            : plannerSignal.tier === 'Forhøjet'
                              ? 'bg-[#e6eeff] text-[var(--color-machine)]'
                              : 'bg-[#e6f4e6] text-[#1a5c1a]',
                        ].join(' ')}
                      >
                        {plannerSignal.tier}
                      </span>
                      <h3
                        className="text-[17px] font-bold tracking-[-0.02em]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {plannerSignal.kommuneNavn}
                      </h3>
                    </div>
                    <p className="mb-6 text-[13px] text-[var(--color-muted)]">
                      Beskriv din begivenhed — AI'en skræddersyr sundhedsvejledningen til din husstand og situationen.
                    </p>

                    <PlannerInput
                      signal={plannerSignal}
                      onSubmit={handlePlannerSubmit}
                      disabled={false}
                    />

                    {/* Chat response — shown after submission */}
                    {plannerEvent && (
                      <div className="mt-6 border-t border-[var(--color-border)] pt-6">
                        <SundhedsradarChat
                          signal={plannerSignal}
                          mode="planner"
                          plannerEvent={plannerEvent}
                        />
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border)] px-[clamp(14px,4vw,32px)] py-6">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-xs text-grey-2">
            Bygget af Kristian Andersen · DST FOLK1A + MEDI1 · SSI spildevand · DMI vejr · Next.js · Vercel AI SDK.
            Tal beregnes deterministisk i kode — modellen narrativiserer dem kun.
            Ikke medicinsk rådgivning.
          </p>
        </div>
      </footer>
    </div>
  )
}
