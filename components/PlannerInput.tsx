'use client'

import { useState } from 'react'
import type { KommuneSignal } from '@/lib/sundhedsradar.types'

// ---------------------------------------------------------------------------
// Example chips — pre-canned planner scenarios
// ---------------------------------------------------------------------------

const EXAMPLES = [
  'Familiefest med ældre bedsteforældre og en baby på 8 måneder',
  'Hospitalsbesøg — vi har en patient i familien med svagt immunforsvar',
  'Udendørs koncert med venner i weekenden',
] as const

const CHIP_LABELS = ['Familiefest', 'Hospitalsbesøg', 'Koncert'] as const

const DEFAULT_TEXT = EXAMPLES[0]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PlannerInputProps {
  signal: KommuneSignal
  disabled?: boolean
  onSubmit: (text: string) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlannerInput({ signal, disabled = false, onSubmit }: PlannerInputProps) {
  const [text, setText] = useState<string>(DEFAULT_TEXT)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-grey-2">
        Beskriv din begivenhed i {signal.kommuneNavn}
      </p>

      {/* Example chips — click to fill textarea */}
      <div className="flex flex-wrap gap-2">
        {CHIP_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setText(EXAMPLES[i])}
            disabled={disabled}
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              text === EXAMPLES[i]
                ? 'border-brand bg-sky text-ink'
                : 'border-grey-4 text-grey-2 hover:border-ink hover:text-ink',
              'disabled:cursor-not-allowed disabled:opacity-50',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Free-text textarea — always pre-filled, never blank */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={500}
        disabled={disabled}
        placeholder="Beskriv begivenheden — hvad, hvornår, hvem deltager…"
        className="w-full resize-none rounded-xl border border-grey-4 bg-paper px-4 py-3 text-sm text-ink outline-none placeholder:text-grey-3 focus:border-brand disabled:opacity-50"
      />

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-grey-3">{text.length}/500 tegn</span>
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-cream transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? 'Analyserer…' : 'Analyser'}
        </button>
      </div>
    </form>
  )
}
