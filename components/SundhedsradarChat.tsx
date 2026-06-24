'use client'

import { useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { KommuneSignal, PlannerEvent } from '@/lib/sundhedsradar.types'
import { SourceChip } from '@/components/SourceChip'
import { parseProse } from '@/lib/prose-parser'
import type { SrcToken } from '@/lib/prose-parser'

// ---------------------------------------------------------------------------
// Source-token resolution — maps sentinel fields → signal values
// ---------------------------------------------------------------------------

type SourceKey = 'SSI' | 'DST' | 'DMI' | 'DAWA'

function resolveValue(token: SrcToken, signal: KommuneSignal): string | number {
  const { source, table, field } = token
  if (source === 'dst') {
    if (table === 'folk1a') {
      if (field === 'totalPopulation') return signal.folk1a.totalPopulation
      if (field === 'age0_2') return signal.folk1a.age0_2
      if (field === 'age65plus') return signal.folk1a.age65plus
    }
    if (table === 'medi1' && field === 'scriptsPerHundred') return signal.medi1.scriptsPerHundred
  }
  if (source === 'ssi' && table === 'wastewater' && field === 'score') return signal.wastewaterScore
  if (source === 'dmi' && table === 'weather' && field === 'meanTempC') {
    return signal.dmiMeanTempC ?? '–'
  }
  if (source === 'eng' && table === 'signal' && field === 'compositeScore') {
    return signal.compositeScore
  }
  return ''
}

function toSourceKey(source: string): SourceKey {
  if (source === 'ssi') return 'SSI'
  if (source === 'dmi') return 'DMI'
  if (source === 'dawa') return 'DAWA'
  return 'DST'
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Part = { type: string; text?: string }

export interface SundhedsradarChatProps {
  signal: KommuneSignal
  mode: 'radar' | 'planner'
  plannerEvent?: PlannerEvent
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SundhedsradarChat({ signal, mode, plannerEvent }: SundhedsradarChatProps) {
  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/sundhedsradar/narrate' }),
  })

  // Track which (signal × plannerEvent) has already been sent to avoid
  // duplicate triggers on unrelated parent re-renders.
  const triggerKeyRef = useRef<string>('')

  useEffect(() => {
    const triggerKey = [
      signal.kommuneKode,
      signal.week,
      signal.year,
      mode,
      plannerEvent?.rawText ?? '',
    ].join(':')

    if (triggerKey === triggerKeyRef.current) return
    triggerKeyRef.current = triggerKey

    // In planner mode without an event, don't auto-trigger — wait for user input.
    if (mode === 'planner' && !plannerEvent) return

    const userText =
      mode === 'planner' && plannerEvent
        ? plannerEvent.rawText
        : `Analyser ${signal.kommuneNavn}`

    setMessages([])
    sendMessage({ text: userText }, { body: { signal, mode, plannerEvent } })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal.kommuneKode, signal.week, signal.year, mode, plannerEvent])

  const busy = status === 'submitted' || status === 'streaming'
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
  const allParts = (lastAssistant?.parts as unknown as Part[]) ?? []
  const hasText = allParts.some((p) => p.type === 'text' && p.text?.trim())

  return (
    <div className="space-y-4">
      {/* Streaming spinner — shown before any text arrives */}
      {status === 'submitted' && !hasText && (
        <p className="flex items-center gap-2 text-sm text-grey-2">
          <span className="step-active inline-block h-2 w-2 rounded-full bg-human" />
          Analyserer…
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-human/40 bg-blush px-4 py-3 text-sm text-human-deep">
          {error.message?.startsWith('NO_KEY:')
            ? error.message.replace(/^NO_KEY:\s*/, '')
            : error.message?.startsWith('RATE_LIMIT:')
              ? error.message.replace(/^RATE_LIMIT:\s*/, '')
              : `Noget gik galt: ${error.message}`}
        </div>
      )}

      {/* Assistant messages */}
      {messages.map((msg) => {
        if (msg.role !== 'assistant') return null
        const parts = msg.parts as unknown as Part[]
        const isLastMsg = msg.id === lastAssistant?.id
        return (
          <div key={msg.id} className="space-y-3">
            {parts.map((part, i) => {
              if (part.type !== 'text' || !part.text) return null
              const tokens = parseProse(part.text)
              const isLastPart = isLastMsg && i === parts.length - 1
              return (
                <p
                  key={i}
                  className={`whitespace-pre-line text-[0.97rem] leading-relaxed text-ink-soft${
                    isLastPart && busy ? ' stream-caret' : ''
                  }`}
                >
                  {tokens.map((tok, ti) => {
                    if (tok.type === 'text') return <span key={ti}>{tok.text}</span>
                    if (tok.type === 'src') {
                      const val = resolveValue(tok, signal)
                      return (
                        <SourceChip
                          key={ti}
                          source={toSourceKey(tok.source)}
                          table={tok.table}
                          kommuneKode={tok.kommuneKode}
                          field={tok.field}
                          value={val}
                          chipIndex={ti}
                        />
                      )
                    }
                    return null
                  })}
                </p>
              )
            })}
          </div>
        )
      })}

      {/* Re-analyse button when streaming is done */}
      {hasText && !busy && (
        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              triggerKeyRef.current = ''
              setMessages([])
              const userText =
                mode === 'planner' && plannerEvent
                  ? plannerEvent.rawText
                  : `Analyser ${signal.kommuneNavn}`
              sendMessage({ text: userText }, { body: { signal, mode, plannerEvent } })
            }}
            className="rounded-full border border-grey-4 px-4 py-2 text-xs text-grey-2 transition-colors hover:border-ink hover:text-ink"
          >
            Genanalyser
          </button>
        </div>
      )}
    </div>
  )
}
