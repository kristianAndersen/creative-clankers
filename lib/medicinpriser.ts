/**
 * Typed async client for the medicinpriser.dk v1 API.
 *
 * Base URL: https://api.medicinpriser.dk/v1 (append ?format=json to all requests)
 *
 * Public API:
 *   searchBySubstance(stof)  → ApiResult<ProduktSearchResult>
 *   getDetail(vnr)           → ApiResult<ProduktDetaljer>
 *   searchByName(navn)       → ApiResult<ProduktSearchResult>
 *
 * Pure helpers:
 *   filterUdgaaet(items)                             → items with Udgaaet !== true
 *   computeReimbursementDelta(anchor, substitutes)   → number | null
 *
 * All public functions return ApiResult<T> — they never throw. Consumers
 * branch on result.ok before using result.data.
 */

import {
  ProduktDetaljerSchema,
  ProduktSearchResultSchema,
} from './medicinpriser.types'

import type {
  ApiResult,
  ProduktDetaljer,
  ProduktSearchResult,
} from './medicinpriser.types'

// ---------------------------------------------------------------------------
// In-memory TTL cache
// ---------------------------------------------------------------------------

const TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

interface CacheEntry {
  data: unknown
  expiresAt: number
}

// Module-level cache — persists across requests in the same serverless instance.
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
// Fetch helpers
// ---------------------------------------------------------------------------

const BASE_URL = 'https://api.medicinpriser.dk/v1'

/**
 * Fetch a URL and return parsed JSON, or an error object.
 * Never throws.
 */
async function fetchJson(url: string): Promise<{ ok: true; json: unknown } | { ok: false; error: string; raw: unknown }> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      let raw: unknown = null
      try { raw = await res.text() } catch { /* ignore */ }
      return { ok: false, error: `HTTP ${res.status} from ${url}`, raw }
    }
    let json: unknown
    try {
      json = await res.json()
    } catch (e) {
      let raw: unknown = null
      try { raw = await (await fetch(url)).text() } catch { /* ignore */ }
      return { ok: false, error: `JSON parse error: ${String(e)}`, raw }
    }
    return { ok: true, json }
  } catch (e) {
    return { ok: false, error: `Network error: ${String(e)}`, raw: null }
  }
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Search by active substance (virksomtstof / INN name).
 * Endpoint: GET /produkter/virksomtstof/{stof}?format=json
 */
export async function searchBySubstance(stof: string): Promise<ApiResult<ProduktSearchResult>> {
  const key = `substance:${stof.trim().toLowerCase()}`
  const cached = cacheGet(key)
  if (cached !== null) {
    return { ok: true, data: cached as ProduktSearchResult, cached: true, cachedAt: _cache.get(key)!.expiresAt - TTL_MS }
  }

  const fetched = await fetchJson(`${BASE_URL}/produkter/virksomtstof/${encodeURIComponent(stof.trim())}?format=json`)
  if (!fetched.ok) return { ok: false, error: fetched.error, raw: fetched.raw }

  const parsed = ProduktSearchResultSchema.safeParse(fetched.json)
  if (!parsed.success) {
    return { ok: false, error: `Zod parse error: ${parsed.error.message}`, raw: fetched.json }
  }

  cacheSet(key, parsed.data)
  return { ok: true, data: parsed.data, cached: false }
}

/**
 * Get full product detail by varenummer (6-digit VNR).
 * Endpoint: GET /produkter/detaljer/{vnr}?format=json
 */
export async function getDetail(vnr: string): Promise<ApiResult<ProduktDetaljer>> {
  const key = `detail:${vnr.trim()}`
  const cached = cacheGet(key)
  if (cached !== null) {
    const entry = _cache.get(key)
    return {
      ok: true,
      data: cached as ProduktDetaljer,
      cached: true,
      cachedAt: entry ? entry.expiresAt - TTL_MS : undefined,
    }
  }

  const fetched = await fetchJson(`${BASE_URL}/produkter/detaljer/${encodeURIComponent(vnr.trim())}?format=json`)
  if (!fetched.ok) return { ok: false, error: fetched.error, raw: fetched.raw }

  const parsed = ProduktDetaljerSchema.safeParse(fetched.json)
  if (!parsed.success) {
    return { ok: false, error: `Zod parse error: ${parsed.error.message}`, raw: fetched.json }
  }

  cacheSet(key, parsed.data)
  return { ok: true, data: parsed.data, cached: false }
}

/**
 * Search by product name (partial name match).
 * Endpoint: GET /produkter/{navn}?format=json
 */
export async function searchByName(navn: string): Promise<ApiResult<ProduktSearchResult>> {
  const key = `name:${navn.trim().toLowerCase()}`
  const cached = cacheGet(key)
  if (cached !== null) {
    return { ok: true, data: cached as ProduktSearchResult, cached: true, cachedAt: _cache.get(key)!.expiresAt - TTL_MS }
  }

  const fetched = await fetchJson(`${BASE_URL}/produkter/${encodeURIComponent(navn.trim())}?format=json`)
  if (!fetched.ok) return { ok: false, error: fetched.error, raw: fetched.raw }

  const parsed = ProduktSearchResultSchema.safeParse(fetched.json)
  if (!parsed.success) {
    return { ok: false, error: `Zod parse error: ${parsed.error.message}`, raw: fetched.json }
  }

  cacheSet(key, parsed.data)
  return { ok: true, data: parsed.data, cached: false }
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Filter out discontinued products (Udgaaet === true).
 * Generic: works on any object that has an optional Udgaaet boolean field.
 * Operates on detail records; search-result items have no Udgaaet field so
 * this is a no-op on them (which is correct — they are never marked).
 */
export function filterUdgaaet<T extends { Udgaaet?: boolean }>(items: T[]): T[] {
  return items.filter((item) => item.Udgaaet !== true)
}

/**
 * Compute the reimbursement delta between the anchor product and the
 * cheapest substitute's AIP price.
 *
 * Formula: (anchor.TilskudBeregnesAf - minSubstituteAIP) / minSubstituteAIP * 100
 *
 * Returns null when:
 *   - anchor.TilskudBeregnesAf is null
 *   - substitutes is empty
 *   - no substitute has a non-null AIP
 *
 * A positive result means anchor's reimbursement basis is MORE expensive
 * than the cheapest substitute's AIP — a procurement flag.
 * A negative result means anchor is cheaper than the cheapest substitute AIP.
 */
export function computeReimbursementDelta(
  anchor: { TilskudBeregnesAf: number | null },
  substitutes: Array<{ AIP: number | null }>
): number | null {
  if (anchor.TilskudBeregnesAf === null) return null
  if (substitutes.length === 0) return null

  const validAIPs = substitutes
    .map((s) => s.AIP)
    .filter((aip): aip is number => aip !== null)

  if (validAIPs.length === 0) return null

  const minAIP = Math.min(...validAIPs)
  return ((anchor.TilskudBeregnesAf - minAIP) / minAIP) * 100
}
