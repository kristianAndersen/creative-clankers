/**
 * Typed DMI Vejr client for Sundhedsradar.
 *
 * Chosen endpoint:
 *   DMI Open Data — climateData / municipalityValue collection
 *   https://dmigw.govcloud.dk/v2/climateData/collections/municipalityValue/items
 *     ?municipalityId={id}&parameterId=mean_temp&datetime={from}/{to}&limit=100&api-key={key}
 *
 * Rationale: the `metObs` collection is station-based and cannot be queried by
 * municipality code directly. The `climateData/municipalityValue` collection
 * (documented at dmi.dk/frie-data/) aggregates daily statistics per Danish
 * municipality and includes `mean_temp` as a parameterId. This avoids station
 * lookup / nearest-station math entirely.
 *
 * kommuneKode mapping: DST 4-digit string ("0101") → DMI numeric ID ("101")
 * (DMI uses integer IDs without zero-padding).
 *
 * Weather is a 10% signal in the composite score. Graceful degradation is the
 * priority: every failure path returns {ok:false} and never throws.
 *
 * Public API:
 *   fetchKommuneWeather(kommuneKode)  → ApiResult<DmiWeatherSlice>
 *   __resetCacheForTests__()          → void (test isolation only)
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// ApiResult pattern (mirrors creativeclankers/lib/medicinpriser.types.ts)
// ---------------------------------------------------------------------------

export type ApiSuccess<T> = { ok: true; data: T; cached?: boolean; cachedAt?: number }
export type ApiError = { ok: false; error: string; raw: unknown }
export type ApiResult<T> = ApiSuccess<T> | ApiError

// ---------------------------------------------------------------------------
// Domain schema + type
// ---------------------------------------------------------------------------

export const DmiWeatherSliceSchema = z.object({
  kommuneKode: z.string(),
  meanTempC: z.number(),
})
export type DmiWeatherSlice = z.infer<typeof DmiWeatherSliceSchema>

// ---------------------------------------------------------------------------
// DMI API response schema (GeoJSON FeatureCollection subset)
// ---------------------------------------------------------------------------

const DmiFeaturePropertiesSchema = z.object({
  municipalityId: z.union([z.string(), z.number()]),
  parameterId: z.string(),
  value: z.number(),
  from: z.string().optional(),
  to: z.string().optional(),
  timeResolution: z.string().optional(),
})

const DmiFeatureSchema = z.object({
  type: z.literal('Feature'),
  properties: DmiFeaturePropertiesSchema,
})

const DmiFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(DmiFeatureSchema),
})

// ---------------------------------------------------------------------------
// In-memory TTL cache — 3 hours
// ---------------------------------------------------------------------------

const TTL_MS = 3 * 60 * 60 * 1000

interface CacheEntry {
  data: unknown
  expiresAt: number
}

let _cache = new Map<string, CacheEntry>()

/**
 * Reset the cache. Exported for test isolation only — not for production use.
 */
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
// Internal fetch helper — never throws
// ---------------------------------------------------------------------------

type FetchJsonResult =
  | { ok: true; json: unknown }
  | { ok: false; error: string; raw: unknown }

async function fetchJson(url: string): Promise<FetchJsonResult> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      let raw: unknown = null
      try { raw = await res.text() } catch { /* ignore */ }
      return { ok: false, error: `HTTP ${res.status} from DMI API`, raw }
    }
    let json: unknown
    try {
      json = await res.json()
    } catch (e) {
      return { ok: false, error: `JSON parse error: ${String(e)}`, raw: null }
    }
    return { ok: true, json }
  } catch (e) {
    return { ok: false, error: `Network error: ${String(e)}`, raw: null }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert DST kommuneKode ("0101") to DMI municipalityId string ("101"). */
function toDmiMunicipalityId(kommuneKode: string): string {
  const n = parseInt(kommuneKode, 10)
  if (Number.isNaN(n)) return kommuneKode
  return String(n)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const DMI_BASE =
  'https://dmigw.govcloud.dk/v2/climateData/collections/municipalityValue/items'

/**
 * Fetch the mean temperature (°C) for the given municipality over the last 7 days.
 *
 * Reads DMI_API_KEY from process.env on every call (HMR-safe, no module-level
 * capture). Returns {ok:false, error:'NO_KEY'} when the key is absent — never
 * throws. All other failure paths also return {ok:false}.
 */
export async function fetchKommuneWeather(
  kommuneKode: string,
): Promise<ApiResult<DmiWeatherSlice>> {
  const apiKey = process.env['DMI_API_KEY'] ?? ''
  if (!apiKey) {
    return { ok: false, error: 'NO_KEY', raw: null }
  }

  const cacheKey = `dmi:${kommuneKode}`
  const cached = cacheGet(cacheKey)
  if (cached !== null) {
    const entry = _cache.get(cacheKey)
    return {
      ok: true,
      data: cached as DmiWeatherSlice,
      cached: true,
      cachedAt: entry ? entry.expiresAt - TTL_MS : undefined,
    }
  }

  const municipalityId = toDmiMunicipalityId(kommuneKode)

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  // Use date-only boundaries so we capture full calendar days in DMI's daily aggregates.
  const fromStr = sevenDaysAgo.toISOString().slice(0, 10) + 'T00:00:00Z'
  const toStr = now.toISOString().slice(0, 10) + 'T23:59:59Z'
  const datetimeRange = `${fromStr}/${toStr}`

  const url =
    `${DMI_BASE}` +
    `?municipalityId=${encodeURIComponent(municipalityId)}` +
    `&parameterId=mean_temp` +
    `&datetime=${encodeURIComponent(datetimeRange)}` +
    `&limit=100` +
    `&api-key=${encodeURIComponent(apiKey)}`

  const fetched = await fetchJson(url)
  if (!fetched.ok) return { ok: false, error: fetched.error, raw: fetched.raw }

  const parsed = DmiFeatureCollectionSchema.safeParse(fetched.json)
  if (!parsed.success) {
    return {
      ok: false,
      error: `Zod parse error: ${parsed.error.message}`,
      raw: fetched.json,
    }
  }

  const features = parsed.data.features
  if (features.length === 0) {
    return {
      ok: false,
      error: `No mean_temp observations returned for municipality ${kommuneKode}`,
      raw: fetched.json,
    }
  }

  const values = features.map((f) => f.properties.value)
  const meanTempC = values.reduce((sum, v) => sum + v, 0) / values.length

  const slice: DmiWeatherSlice = { kommuneKode, meanTempC }
  cacheSet(cacheKey, slice)
  return { ok: true, data: slice, cached: false }
}
