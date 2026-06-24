import { NextRequest, NextResponse } from 'next/server'
import { fetchFolk1a, fetchMedi1 } from '@/lib/dst-client'
import { fetchKommuneWeather } from '@/lib/dmi-client'
import { fetchKommuneList } from '@/lib/dawa-client'
import { computeKommuneSignal } from '@/lib/sundhedsradar'
import type { RawSignalInputs } from '@/lib/sundhedsradar'
import type { KommuneSignal } from '@/lib/sundhedsradar.types'
import { rateLimit } from '@/lib/ratelimit'
import wastewaterSnapshot from '@/data/ssi-wastewater-snapshot.json'
import seasonalBaselines from '@/data/ssi-seasonal-baselines.json'

export const maxDuration = 30

// ---------------------------------------------------------------------------
// ISO week helpers
// ---------------------------------------------------------------------------

function isoWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { week, year: d.getUTCFullYear() }
}

// ---------------------------------------------------------------------------
// SSI seasonal baseline (0–1) for the current ISO week
// ---------------------------------------------------------------------------

type BaselineEntry = { week: number; nationalTier: string }

function tierScore(tier: string): number {
  if (tier === 'Høj') return 1
  if (tier === 'Forhøjet') return 0.5
  return 0
}

function getSeasonalBaseline(week: number): number {
  const entries = (seasonalBaselines as BaselineEntry[]).filter((e) => e.week === week)
  if (entries.length === 0) return 0.3
  const sum = entries.reduce((acc, e) => acc + tierScore(e.nationalTier), 0)
  return sum / entries.length
}

// ---------------------------------------------------------------------------
// SSI wastewater score for a single kommuneKode (max across plants)
// ---------------------------------------------------------------------------

type WastewaterPlant = { kommuneKode: string; score: number }
type WastewaterSnapshot = { plants: WastewaterPlant[] }

function getWastewaterScore(kommuneKode: string): 0 | 1 | 2 | 3 {
  const plants = (wastewaterSnapshot as WastewaterSnapshot).plants.filter(
    (p) => p.kommuneKode === kommuneKode,
  )
  if (plants.length === 0) return 0
  const max = Math.max(...plants.map((p) => p.score))
  if (max === 0 || max === 1 || max === 2 || max === 3) return max as 0 | 1 | 2 | 3
  return 0
}

// ---------------------------------------------------------------------------
// Per-kommune signal computation — consumes client results via .ok ONLY
// ---------------------------------------------------------------------------

type SignalResult =
  | { ok: true; signal: KommuneSignal }
  | { ok: false; error: string }

async function computeSignalForKommune(
  kommuneKode: string,
  kommuneNavn: string,
  now: Date,
): Promise<SignalResult> {
  const { week, year } = isoWeek(now)

  const [folk1aResult, medi1Result, weatherResult] = await Promise.all([
    fetchFolk1a(kommuneKode),
    fetchMedi1(kommuneKode),
    fetchKommuneWeather(kommuneKode),
  ])

  // FOLK1A and MEDI1 are required — return 502 on failure
  if (!folk1aResult.ok) {
    return { ok: false, error: `DST FOLK1A failed for ${kommuneKode}` }
  }
  if (!medi1Result.ok) {
    return { ok: false, error: `DST MEDI1 failed for ${kommuneKode}` }
  }

  // DMI is optional — degrade gracefully to null (10% signal uses 0.5 neutral)
  const dmiMeanTempC = weatherResult.ok ? weatherResult.data.meanTempC : null

  const wastewaterScore = getWastewaterScore(kommuneKode)
  const seasonalBaseline = getSeasonalBaseline(week)

  const inputs: RawSignalInputs = {
    kommuneKode,
    kommuneNavn,
    week,
    year,
    folk1aSlice: folk1aResult.data,
    medi1Slice: medi1Result.data,
    wastewaterScore,
    seasonalBaseline,
    dmiMeanTempC,
  }

  try {
    const signal = computeKommuneSignal(inputs)
    return { ok: true, signal }
  } catch (e) {
    return { ok: false, error: `Signal computation failed: ${String(e)}` }
  }
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'
  const limit = rateLimit(ip)
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const { searchParams } = new URL(req.url)
  const kommuneKodeParam = searchParams.get('kommuneKode')

  if (!kommuneKodeParam) {
    return NextResponse.json(
      { error: 'Missing required query parameter: kommuneKode' },
      { status: 400 },
    )
  }

  const now = new Date()

  // --- ?kommuneKode=all — return array of KommuneSignal ---
  if (kommuneKodeParam === 'all') {
    const kommuneListResult = await fetchKommuneList()
    if (!kommuneListResult.ok) {
      return NextResponse.json(
        { error: `DAWA commune list unavailable: ${kommuneListResult.reason}` },
        { status: 502 },
      )
    }

    const results = await Promise.all(
      kommuneListResult.data.map((k) =>
        computeSignalForKommune(k.kode, k.navn, now),
      ),
    )

    const signals = results.flatMap((r) => (r.ok ? [r.signal] : []))
    return NextResponse.json(signals)
  }

  // --- Single kommuneKode ---
  if (!/^\d{4}$/.test(kommuneKodeParam)) {
    return NextResponse.json(
      { error: 'kommuneKode must be a 4-digit string (e.g. "0101")' },
      { status: 400 },
    )
  }

  // Resolve kommuneNavn via DAWA (cached after first call)
  let kommuneNavn = kommuneKodeParam
  const kommuneListResult = await fetchKommuneList()
  if (kommuneListResult.ok) {
    const found = kommuneListResult.data.find((k) => k.kode === kommuneKodeParam)
    if (found) kommuneNavn = found.navn
  }

  const result = await computeSignalForKommune(kommuneKodeParam, kommuneNavn, now)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }
  return NextResponse.json(result.signal)
}
