/**
 * Typed async client for the DAWA (Danmarks Adressers Web API).
 *
 * Base URL: https://api.dataforsyningen.dk (no auth required)
 *
 * Public API:
 *   fetchKommuneList()          → ApiResult<DawaKommune[]>   (all 98 municipalities)
 *   reverseGeocode(lon, lat)    → ApiResult<DawaReverseResult>
 *
 * All public functions return ApiResult<T> — they never throw. Consumers
 * branch on result.ok before using result.data.
 *
 * The kommune list is cached indefinitely at module level (boundaries are stable).
 * Call __resetCacheForTests__() to clear between test cases.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Public Zod schemas and inferred types
// ---------------------------------------------------------------------------

export const DawaKommuneSchema = z.object({
  kode: z.string(),
  navn: z.string(),
})
export type DawaKommune = z.infer<typeof DawaKommuneSchema>

export const DawaReverseResultSchema = z.object({
  kommuneKode: z.string(),
  kommuneNavn: z.string(),
})
export type DawaReverseResult = z.infer<typeof DawaReverseResultSchema>

// ---------------------------------------------------------------------------
// ApiResult discriminated union
// ---------------------------------------------------------------------------

export type ApiResult<T> = { ok: true; data: T } | { ok: false; reason: string }

// ---------------------------------------------------------------------------
// Module-level never-expiring cache for kommune list
// ---------------------------------------------------------------------------

let _cache = new Map<string, DawaKommune[]>()

/**
 * Reset the cache. Exported for test isolation only — not for production use.
 */
export function __resetCacheForTests__(): void {
  _cache = new Map()
}

// ---------------------------------------------------------------------------
// Internal Zod schemas for raw DAWA API responses
// ---------------------------------------------------------------------------

// The /kommuner endpoint returns objects with many fields; we pick what we need.
// udenforkommuneinddeling flags non-municipal entries (e.g. Christiansø).
const RawKommuneItemSchema = z.object({
  kode: z.string(),
  navn: z.string(),
  udenforkommuneinddeling: z.boolean().optional(),
})

const RawKommuneListSchema = z.array(RawKommuneItemSchema)

// The /adgangsadresser/reverse endpoint returns a full adgangsadresse with a
// nested kommune object containing kode and navn.
const RawReverseSchema = z.object({
  kommune: z.object({
    kode: z.string(),
    navn: z.string(),
  }),
})

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

const BASE_URL = 'https://api.dataforsyningen.dk'

async function fetchJson(
  url: string,
): Promise<{ ok: true; json: unknown } | { ok: false; reason: string }> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      return { ok: false, reason: `HTTP ${res.status} from ${url}` }
    }
    try {
      const json: unknown = await res.json()
      return { ok: true, json }
    } catch (e) {
      return { ok: false, reason: `JSON parse error: ${String(e)}` }
    }
  } catch (e) {
    return { ok: false, reason: `Network error: ${String(e)}` }
  }
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

const KOMMUNE_CACHE_KEY = 'kommuner'

/**
 * Fetch all 98 Danish municipalities from DAWA.
 * Results are cached indefinitely (boundaries are stable).
 * Excludes entries with udenforkommuneinddeling === true (e.g. Christiansø).
 */
export async function fetchKommuneList(): Promise<ApiResult<DawaKommune[]>> {
  const cached = _cache.get(KOMMUNE_CACHE_KEY)
  if (cached !== undefined) return { ok: true, data: cached }

  const fetched = await fetchJson(`${BASE_URL}/kommuner`)
  if (!fetched.ok) return { ok: false, reason: fetched.reason }

  const parsed = RawKommuneListSchema.safeParse(fetched.json)
  if (!parsed.success) {
    return { ok: false, reason: `Zod parse error: ${parsed.error.message}` }
  }

  const kommuner: DawaKommune[] = parsed.data
    .filter((k) => !k.udenforkommuneinddeling)
    .map((k) => ({ kode: k.kode, navn: k.navn }))

  _cache.set(KOMMUNE_CACHE_KEY, kommuner)
  return { ok: true, data: kommuner }
}

/**
 * Reverse geocode a coordinate to the containing municipality.
 * Not cached — coordinates are unbounded and results are not stable.
 */
export async function reverseGeocode(
  lon: number,
  lat: number,
): Promise<ApiResult<DawaReverseResult>> {
  const fetched = await fetchJson(
    `${BASE_URL}/adgangsadresser/reverse?x=${lon}&y=${lat}`,
  )
  if (!fetched.ok) return { ok: false, reason: fetched.reason }

  const parsed = RawReverseSchema.safeParse(fetched.json)
  if (!parsed.success) {
    return { ok: false, reason: `Zod parse error: ${parsed.error.message}` }
  }

  const result: DawaReverseResult = {
    kommuneKode: parsed.data.kommune.kode,
    kommuneNavn: parsed.data.kommune.navn,
  }

  const validated = DawaReverseResultSchema.safeParse(result)
  if (!validated.success) {
    return { ok: false, reason: `Result shape error: ${validated.error.message}` }
  }

  return { ok: true, data: validated.data }
}
