import {
  streamText,
  generateObject,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
  type UIMessageChunk,
} from 'ai'
import { z } from 'zod'
import { resolveModel, resolveModelChain, isTransient } from '@/lib/model'
import type { KommuneSignal, PlannerEvent } from '@/lib/sundhedsradar.types'
import { PlannerEventSchema } from '@/lib/sundhedsradar.types'
import { rateLimit } from '@/lib/ratelimit'

export const maxDuration = 30

// ---------------------------------------------------------------------------
// Request body schema
// ---------------------------------------------------------------------------

const requestBodySchema = z.object({
  messages: z.array(z.unknown()).default([]),
  signal: z.record(z.string(), z.unknown()),
  mode: z.enum(['radar', 'planner']),
  plannerEvent: PlannerEventSchema.optional(),
})

// ---------------------------------------------------------------------------
// System prompt builder — locked sentinels for every number
// ---------------------------------------------------------------------------

function buildSystem(signal: KommuneSignal, plannerEvent?: PlannerEvent): string {
  const k = signal.kommuneKode

  const toneGuide =
    signal.tier === 'Høj'
      ? 'Tone: urgent and direct. Residents need to act now to protect vulnerable household members.'
      : signal.tier === 'Forhøjet'
      ? 'Tone: attentive and informative. Residents should stay alert and take sensible precautions.'
      : 'Tone: calm and reassuring. Normal hygiene habits are sufficient; no special measures required.'

  const plannerContext = plannerEvent
    ? [
        '',
        'PLANNER KONTEKST (tilpas forholdsreglerne til dette husstands- og begivenhedsprofil):',
        `Planlagt begivenhed: "${plannerEvent.rawText}"`,
        `Dato: ${plannerEvent.parsedDate ?? 'ukendt'}`,
        `Husstand: spædbørn: ${plannerEvent.householdFlags.hasInfant ? 'ja' : 'nej'}, ældre: ${plannerEvent.householdFlags.hasElderly ? 'ja' : 'nej'}`,
      ].join('\n')
    : ''

  const sentinelLines: string[] = [
    `[SRC:dst:folk1a:${k}:totalPopulation]  ← folketal (heltal)`,
    `[SRC:dst:folk1a:${k}:age0_2]           ← børn 0-2 år (heltal)`,
    `[SRC:dst:folk1a:${k}:age65plus]        ← borgere 65+ år (heltal)`,
    `[SRC:dst:medi1:${k}:scriptsPerHundred] ← recepter pr. 100 borgere (luftveje + antibiotika)`,
  ]
  if (signal.wastewaterScore > 0) {
    sentinelLines.push(`[SRC:ssi:wastewater:${k}:score]         ← spildevandssignal (0–3)`)
  }
  if (signal.dmiMeanTempC !== null) {
    sentinelLines.push(`[SRC:dmi:weather:${k}:meanTempC]        ← middeltemperatur °C (seneste 7 dage)`)
  }
  sentinelLines.push(`[SRC:eng:signal:${k}:compositeScore]   ← samlet risikoscore (0–1)`)

  return `Du er en dansk folkesundhedsrådgiver for ${signal.kommuneNavn} kommune. Uge ${signal.week}, ${signal.year}. Risikoniveau: ${signal.tier}.

${toneGuide}${plannerContext}

TILGÆNGELIGE SENTINELS (brug KUN disse — alle tal skal stå som sentinels):
${sentinelLines.join('\n')}

TAL-DISCIPLIN — KRITISK:
Du MÅ IKKE skrive rå tal i din tekst. Hvert tal — uden undtagelse — skal skrives som sentinel:
  [SRC:source:table:kommuneKode:field]
Eksempel: "I ${signal.kommuneNavn} bor [SRC:dst:folk1a:${k}:totalPopulation] borgere, heraf [SRC:dst:folk1a:${k}:age65plus] over 65 år."
Brug ALDRIG bare et tal som "42.5", "1234" eller "0,78" — UI'et renderer sentinels som interaktive chips.

OUTPUTFORMAT:
1. Ét introduktionsafsnit (2–3 sætninger): beskriv risikoniveauet med begrundelse fra de tilgængelige data.
2. To konkrete forholdsregler tilpasset risikoniveauet ${plannerEvent ? 'og husstandsprofilen' : ''}.
3. En kort afrunding (1 sætning). Ingen medicinsk rådgivning ("konsultér din læge" er OK).

REGLER:
- Skriv på dansk
- Ingen markdown-overskrifter (ingen ##, ingen **bold** headings)
- Maks ~800 tokens
- Ingen LLM-værktøjer`
}

// ---------------------------------------------------------------------------
// Extract last user message text (mirrors substitution/route.ts)
// ---------------------------------------------------------------------------

function extractQuery(messages: UIMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === 'user')
  if (!last) return ''
  for (const p of (last.parts ?? []) as { type?: string; text?: string }[]) {
    if (p.type === 'text' && p.text) return p.text
  }
  return ''
}

// ---------------------------------------------------------------------------
// friendlyError — mirrors substitution/route.ts exactly
// ---------------------------------------------------------------------------

function friendlyError(err: unknown): string {
  const e: unknown =
    err && typeof err === 'object' && 'error' in err
      ? (err as { error: unknown }).error
      : err
  const anyE = e as {
    message?: string
    responseBody?: string
    name?: string
  } | null
  const msg =
    anyE?.message ||
    anyE?.responseBody ||
    (typeof e === 'string' ? e : '') ||
    anyE?.name ||
    'unknown error'
  if (/high demand|overloaded|temporarily|503|unavailable/i.test(msg)) {
    return 'RATE_LIMIT: The model is temporarily overloaded (free-tier high demand). Wait a few seconds and try again.'
  }
  if (
    /tokens per (minute|day)|\bTPM\b|\bTPD\b|rate.?limit|too large|\b429\b|quota|exceeded your|resource.?exhausted|insufficient/i.test(
      msg,
    )
  ) {
    return 'RATE_LIMIT: Free-tier quota/rate limit reached on all providers. Wait a bit, or switch provider via AI_PROVIDER.'
  }
  return `Sundhedsradar narrate error: ${msg}`
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const chain = resolveModelChain()

  if (chain.length === 0) {
    const { keyHint } = resolveModel()
    return Response.json(
      { error: `NO_KEY: Missing ${keyHint}. Add it to .env.local.` },
      { status: 500 },
    )
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'
  const limit = rateLimit(ip)
  if (!limit.ok) {
    return Response.json(
      { error: `Rate limit reached. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const rawBody: unknown = await req.json()
  const parsed = requestBodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return Response.json(
      { error: `Invalid request body: ${parsed.error.message}` },
      { status: 400 },
    )
  }
  const { messages, signal: rawSignal, mode, plannerEvent: bodyPlannerEvent } = parsed.data

  // Cast signal — validated at the route boundary
  const signal = rawSignal as unknown as KommuneSignal

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      let plannerEvent: PlannerEvent | undefined = bodyPlannerEvent

      // PLANNER MODE: extract structured PlannerEvent from free text via generateObject
      if (mode === 'planner' && !plannerEvent) {
        const rawText = extractQuery(messages as UIMessage[])
        if (rawText) {
          const plannerSchema = z.object({
            rawText: z.string().min(5).max(500),
            parsedDate: z.string().nullable(),
            parsedKommuneKode: z.string().nullable(),
            householdFlags: z.object({
              hasInfant: z.boolean(),
              hasElderly: z.boolean(),
            }),
          })

          let plannerResult: { object: PlannerEvent } | null = null
          for (let ci = 0; ci < chain.length; ci++) {
            const entry = chain[ci]
            const isLast = ci === chain.length - 1
            try {
              plannerResult = await generateObject({
                model: entry.model,
                schema: plannerSchema,
                prompt: `Extract household planning context from this Danish text: "${rawText}"\n\nIdentify: any date mentioned, any municipality code (4-digit), whether there are infants (0-2 years) or elderly (65+) in the household.`,
                maxOutputTokens: 300,
                maxRetries: 4,
                ...(entry.provider === 'groq' ? { temperature: 0.1 } : {}),
              })
              break
            } catch (err) {
              if (!isLast && isTransient(err)) continue
              // Non-critical: fall through with undefined plannerEvent
              break
            }
          }

          if (plannerResult) {
            plannerEvent = plannerResult.object
          }
        }
      }

      const systemPrompt = buildSystem(signal, plannerEvent)
      const narratePrompt = `Skriv en folkesundhedsrapport for ${signal.kommuneNavn} uge ${signal.week} ${signal.year}.\n\nSignaldata (JSON):\n${JSON.stringify(signal, null, 2)}`

      let synthLastError: unknown
      let synthDone = false

      for (let ci = 0; ci < chain.length && !synthDone; ci++) {
        const entry = chain[ci]
        const isLast = ci === chain.length - 1

        const result = streamText({
          model: entry.model,
          system: systemPrompt,
          prompt: narratePrompt,
          maxOutputTokens: 800,
          maxRetries: 4,
          ...(entry.provider === 'groq' ? { temperature: 0.3 } : {}),
        })

        let textStarted = false
        const preTextBuffer: UIMessageChunk[] = []
        let capturedError: unknown
        let shouldFallback = false

        for await (const chunk of result.toUIMessageStream({
          onError: (err) => {
            capturedError = err
            return friendlyError(err)
          },
        })) {
          const chunkType = (chunk as { type: string }).type

          if (chunkType === 'error') {
            if (!textStarted && !isLast && isTransient(capturedError)) {
              synthLastError = capturedError
              shouldFallback = true
              break
            }
            for (const b of preTextBuffer) {
              ;(writer.write as (c: unknown) => void)(b)
            }
            ;(writer.write as (c: unknown) => void)(chunk)
            synthDone = true
            break
          }

          if (!textStarted) {
            if (chunkType === 'text-delta') {
              textStarted = true
              for (const b of preTextBuffer) {
                ;(writer.write as (c: unknown) => void)(b)
              }
              preTextBuffer.length = 0
              ;(writer.write as (c: unknown) => void)(chunk)
            } else {
              preTextBuffer.push(chunk as UIMessageChunk)
            }
          } else {
            ;(writer.write as (c: unknown) => void)(chunk)
          }
        }

        if (shouldFallback) continue

        if (!synthDone) {
          for (const b of preTextBuffer) {
            ;(writer.write as (c: unknown) => void)(b)
          }
          synthDone = true
        }
      }

      if (!synthDone) {
        ;(writer.write as (c: unknown) => void)({
          type: 'error',
          errorText: friendlyError(synthLastError),
        })
      }
    },
    onError: friendlyError,
  })

  return createUIMessageStreamResponse({
    stream: stream as unknown as ReadableStream<UIMessageChunk>,
  })
}
