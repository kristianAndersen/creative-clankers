/**
 * Tests for lib/medicinpriser.ts
 * TDD: written before implementation. Run to confirm red first.
 *
 * These tests mock global.fetch and vi.useFakeTimers() — no network calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We import from the module-under-test. The cache is module-level so we
// need to reset it between tests — we expose a __resetCacheForTests__ export.
import {
  searchBySubstance,
  getDetail,
  searchByName,
  filterUdgaaet,
  computeReimbursementDelta,
  __resetCacheForTests__,
} from '../medicinpriser'

import type { ProduktDetaljer, ProduktSearchItem } from '../medicinpriser.types'

// ---------------------------------------------------------------------------
// Helpers: minimal fixture data matching live API shapes
// ---------------------------------------------------------------------------

const makeSearchItem = (overrides: Partial<ProduktSearchItem> = {}): ProduktSearchItem => ({
  Navn: 'Paracetamol "Zentiva"',
  Varenummer: '062391',
  Firma: 'Zentiva',
  Styrke: '1000 mg',
  Detaljer: '/v1/produkter/detaljer/062391',
  Pakning: '100 stk.',
  ...overrides,
})

const makeDetail = (overrides: Partial<ProduktDetaljer> = {}): ProduktDetaljer => ({
  Navn: 'Paracetamol "Zentiva"',
  Varenummer: '062391',
  Styrke: '1000 mg',
  Pakning: '100 stk.',
  VirksomtStof: 'Paracetamol',
  Firma: 'Zentiva',
  AtcKode: 'N02BE01',
  PrisPrPakning: 44.5,
  PrisPrEnhed: 0.45,
  AIP: 17.52,
  TilskudBeregnesAf: 39.95,
  Udgaaet: false,
  UdgaaetDato: null,
  Substitutioner: [],
  ...overrides,
})

// ---------------------------------------------------------------------------
// Cache: miss / hit / TTL expiry
// ---------------------------------------------------------------------------

describe('in-memory cache', () => {
  beforeEach(() => {
    __resetCacheForTests__()
    vi.useFakeTimers()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => makeDetail(),
    } as Response)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns data on first call (cache miss → network fetch)', async () => {
    const result = await getDetail('062391')
    expect(result.ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('returns cached data on second call within TTL (no second fetch)', async () => {
    await getDetail('062391')
    const result = await getDetail('062391')
    expect(result.ok).toBe(true)
    // Only one fetch despite two calls
    expect(global.fetch).toHaveBeenCalledTimes(1)
    if (result.ok) {
      expect(result.cached).toBe(true)
    }
  })

  it('refetches after TTL expires (12 hours)', async () => {
    await getDetail('062391')
    // Advance time past 12h TTL
    vi.advanceTimersByTime(12 * 60 * 60 * 1000 + 1)
    await getDetail('062391')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('normalises cache key case — "Metformin" and "metformin" hit the same entry', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [makeSearchItem()],
    } as Response)
    await searchBySubstance('Metformin')
    await searchBySubstance('metformin')
    // Both calls should share one cache entry → only one fetch
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Error handling: non-ok response and network error
// ---------------------------------------------------------------------------

describe('error handling', () => {
  beforeEach(() => {
    __resetCacheForTests__()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns { ok: false, error, raw } on non-ok HTTP response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    } as Response)
    const result = await getDetail('999999')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(typeof result.error).toBe('string')
    }
  })

  it('returns { ok: false, error, raw } on Zod parse failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ unexpected: 'shape' }),
    } as Response)
    const result = await getDetail('062391')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/parse/i)
    }
  })

  it('returns { ok: false, error, raw } on network/fetch throw', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))
    const result = await getDetail('062391')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(typeof result.error).toBe('string')
    }
  })
})

// ---------------------------------------------------------------------------
// filterUdgaaet
// ---------------------------------------------------------------------------

describe('filterUdgaaet', () => {
  it('removes items with Udgaaet: true', () => {
    const items = [
      makeDetail({ Varenummer: '001', Udgaaet: false }),
      makeDetail({ Varenummer: '002', Udgaaet: true }),
      makeDetail({ Varenummer: '003', Udgaaet: false }),
    ]
    const result = filterUdgaaet(items)
    expect(result).toHaveLength(2)
    expect(result.map((x) => x.Varenummer)).toEqual(['001', '003'])
  })

  it('returns empty array unchanged', () => {
    expect(filterUdgaaet([])).toEqual([])
  })

  it('keeps items with Udgaaet: false', () => {
    const items = [makeDetail({ Udgaaet: false })]
    expect(filterUdgaaet(items)).toHaveLength(1)
  })

  it('works on objects with only { Udgaaet: boolean } (generic)', () => {
    const items = [{ Udgaaet: true }, { Udgaaet: false }]
    const result = filterUdgaaet(items)
    expect(result).toHaveLength(1)
    expect(result[0].Udgaaet).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// computeReimbursementDelta
// ---------------------------------------------------------------------------

describe('computeReimbursementDelta', () => {
  it('returns correct delta %: (anchor.TilskudBeregnesAf - minSubstituteAIP) / minSubstituteAIP * 100', () => {
    const anchor = makeDetail({ TilskudBeregnesAf: 39.95 })
    const subs = [
      makeDetail({ AIP: 17.52 }),
      makeDetail({ AIP: 20.0 }),
    ]
    // minAIP = 17.52; delta = (39.95 - 17.52) / 17.52 * 100 = 128.02...
    const delta = computeReimbursementDelta(anchor, subs)
    expect(delta).toBeCloseTo(128.02, 1)
  })

  it('returns null when anchor TilskudBeregnesAf is null', () => {
    const anchor = makeDetail({ TilskudBeregnesAf: null })
    const subs = [makeDetail({ AIP: 17.52 })]
    expect(computeReimbursementDelta(anchor, subs)).toBeNull()
  })

  it('returns null when no substitutes have non-null AIP', () => {
    const anchor = makeDetail({ TilskudBeregnesAf: 39.95 })
    const subs = [makeDetail({ AIP: null })]
    expect(computeReimbursementDelta(anchor, subs)).toBeNull()
  })

  it('returns null when substitutes array is empty', () => {
    const anchor = makeDetail({ TilskudBeregnesAf: 39.95 })
    expect(computeReimbursementDelta(anchor, [])).toBeNull()
  })

  it('ignores null AIPs when finding the minimum', () => {
    const anchor = makeDetail({ TilskudBeregnesAf: 50.0 })
    const subs = [
      makeDetail({ AIP: null }),
      makeDetail({ AIP: 25.0 }),
      makeDetail({ AIP: null }),
    ]
    const delta = computeReimbursementDelta(anchor, subs)
    // minAIP = 25.0; delta = (50 - 25) / 25 * 100 = 100
    expect(delta).toBeCloseTo(100.0, 1)
  })
})
