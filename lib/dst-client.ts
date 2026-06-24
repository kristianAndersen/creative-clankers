/**
 * Typed async client for the DST (Danmarks Statistik) Statistikbanken REST API.
 *
 * Base URL: https://api.statbank.dk/v1 (open, no auth)
 *
 * Public API:
 *   fetchFolk1a(kommuneKode)  → ApiResult<Folk1aSlice>
 *   fetchMedi1(kommuneKode)   → ApiResult<Medi1Slice>
 *
 * Both functions return ApiResult<T> and never throw. 24-hour module-level
 * Map cache keyed by table:kommuneKode.
 *
 * Verified dimension codes (empirically confirmed via tableinfo endpoint):
 *   FOLK1A: OMRÅDE (3-digit DST code), KØN=TOT, ALDER=IALT/0..2/65..125, CIVILSTAND=TOT
 *   MEDI1:  KOMMUNEDK (3-digit DST code), BNØGLE=1100 (per-100 rate),
 *           MEDICINTYPE=R03+J01, ALERAMS=0000 (all ages), Tid=latest year
 */

import { z } from 'zod'
import {
  Folk1aSliceSchema,
  Medi1SliceSchema,
} from '@/lib/sundhedsradar.types'
import type { Folk1aSlice, Medi1Slice } from '@/lib/sundhedsradar.types'

// ---------------------------------------------------------------------------
// ApiResult
// ---------------------------------------------------------------------------

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: string }

// ---------------------------------------------------------------------------
// 24-hour TTL cache
// ---------------------------------------------------------------------------

const TTL_MS = 24 * 60 * 60 * 1000

interface CacheEntry {
  data: unknown
  expiresAt: number
}

let _cache = new Map<string, CacheEntry>()

/** Reset the cache. Exported for test isolation only. */
export function __resetCacheForTests__(): void {
  _cache = new Map()
}

function cacheGet(key: string): unknown | null {
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key)
    return null
  }
  return entry.data
}

function cacheSet(key: string, data: unknown): void {
  _cache.set(key, { data, expiresAt: Date.now() + TTL_MS })
}

// ---------------------------------------------------------------------------
// DST API helpers
// ---------------------------------------------------------------------------

const DST_DATA_URL = 'https://api.statbank.dk/v1/data'

interface DstVariable {
  code: string
  values: string[]
}

interface DstRequest {
  table: string
  format: 'JSONSTAT'
  lang: 'da'
  variables: DstVariable[]
}

// We only need the flat values array; dimension ordering is controlled by our request.
const DstResponseSchema = z.object({
  dataset: z.object({
    value: z.array(z.union([z.number(), z.null()])),
  }).passthrough(),
})

async function postDstData(
  body: DstRequest,
): Promise<{ ok: true; values: (number | null)[] } | { ok: false; reason: string }> {
  try {
    const res = await fetch(DST_DATA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, reason: `HTTP ${res.status}: ${text}` }
    }
    const json: unknown = await res.json()
    const parsed = DstResponseSchema.safeParse(json)
    if (!parsed.success) {
      return { ok: false, reason: `DST response shape unexpected: ${parsed.error.message}` }
    }
    return { ok: true, values: parsed.data.dataset.value }
  } catch (e) {
    return { ok: false, reason: `Network error: ${String(e)}` }
  }
}

/**
 * Strip leading zeros from a 4-digit kommunekode to produce the 3-digit DST
 * dimension code. '0751' → '751', '0101' → '101'.
 */
function toDstKode(kommuneKode: string): string {
  const stripped = kommuneKode.replace(/^0+/, '')
  return stripped.length > 0 ? stripped : kommuneKode
}

/** Generate an inclusive range of age codes as strings: ageRange(65, 67) → ['65','66','67'] */
function ageRange(from: number, to: number): string[] {
  return Array.from({ length: to - from + 1 }, (_, i) => String(from + i))
}

// Age codes for 65+: '65' through '125' (FOLK1A has individual years up to 125).
const ALDER_65_PLUS = ageRange(65, 125)

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch population slice for a Danish municipality from FOLK1A.
 *
 * Returns totalPopulation (IALT), age0_2 (sum of 0-, 1-, 2-year-olds), and
 * age65plus (sum of 65-125 year-olds) for the latest available quarter.
 * Omitting Tid causes DST to return only the most recent period.
 */
export async function fetchFolk1a(kommuneKode: string): Promise<ApiResult<Folk1aSlice>> {
  const key = `folk1a:${kommuneKode}`
  const cached = cacheGet(key)
  if (cached !== null) return { ok: true, data: cached as Folk1aSlice }

  const kode = toDstKode(kommuneKode)
  const result = await postDstData({
    table: 'FOLK1A',
    format: 'JSONSTAT',
    lang: 'da',
    variables: [
      { code: 'OMRÅDE', values: [kode] },
      { code: 'KØN', values: ['TOT'] },
      // ALDER order: IALT=0, 0yr=1, 1yr=2, 2yr=3, 65yr=4 … 125yr=64
      { code: 'ALDER', values: ['IALT', '0', '1', '2', ...ALDER_65_PLUS] },
      { code: 'CIVILSTAND', values: ['TOT'] },
    ],
  })

  if (!result.ok) return { ok: false, reason: result.reason }

  const vals = result.values
  const total = vals[0]
  if (total === null) {
    return { ok: false, reason: `FOLK1A returned null totalPopulation for ${kommuneKode}` }
  }

  const age0_2 = (vals[1] ?? 0) + (vals[2] ?? 0) + (vals[3] ?? 0)

  let age65plus = 0
  for (let i = 4; i < vals.length; i++) {
    age65plus += vals[i] ?? 0
  }

  const raw = { kommuneKode, totalPopulation: total, age0_2, age65plus }
  const parsed = Folk1aSliceSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, reason: `Folk1aSlice validation failed: ${parsed.error.message}` }
  }

  cacheSet(key, parsed.data)
  return { ok: true, data: parsed.data }
}

/**
 * Fetch prescription rate slice for a Danish municipality from MEDI1.
 *
 * scriptsPerHundred = sum of prescriptions per 100 inhabitants for ATC groups
 * R03 (respiratory / asthma / COPD) and J01 (systemic antibacterials), all ages,
 * latest available year.
 *
 * BNØGLE '1100' = "Recepter pr. 100 borgere".
 * ALERAMS '0000' = all age groups.
 * Omitting Tid returns only the most recent year.
 */
export async function fetchMedi1(kommuneKode: string): Promise<ApiResult<Medi1Slice>> {
  const key = `medi1:${kommuneKode}`
  const cached = cacheGet(key)
  if (cached !== null) return { ok: true, data: cached as Medi1Slice }

  const kode = toDstKode(kommuneKode)
  const result = await postDstData({
    table: 'MEDI1',
    format: 'JSONSTAT',
    lang: 'da',
    variables: [
      { code: 'KOMMUNEDK', values: [kode] },
      { code: 'BNØGLE', values: ['1100'] },
      // MEDICINTYPE order: R03=0, J01=1
      { code: 'MEDICINTYPE', values: ['R03', 'J01'] },
      { code: 'ALERAMS', values: ['0000'] },
    ],
  })

  if (!result.ok) return { ok: false, reason: result.reason }

  const vals = result.values
  // vals[0] = R03 per 100 inhabitants, vals[1] = J01 per 100 inhabitants
  const scriptsPerHundred = (vals[0] ?? 0) + (vals[1] ?? 0)

  const raw = { kommuneKode, scriptsPerHundred }
  const parsed = Medi1SliceSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, reason: `Medi1Slice validation failed: ${parsed.error.message}` }
  }

  cacheSet(key, parsed.data)
  return { ok: true, data: parsed.data }
}
