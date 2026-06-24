import { describe, it, expect } from 'vitest'
import type { ProduktDetaljer, ProduktSearchItem } from '../medicinpriser.types'
import type { MedicinpriserClient } from '../substitution'
import { assembleBriefing } from '../substitution'

const makeSearchItem = (overrides: Partial<ProduktSearchItem> = {}): ProduktSearchItem => ({
  Navn: 'Metformin "Orion"',
  Varenummer: '052847',
  Firma: 'Orion',
  Styrke: '500 mg',
  Detaljer: '/v1/produkter/detaljer/052847',
  Pakning: '100 stk.',
  ...overrides,
})

const makeDetail = (overrides: Partial<ProduktDetaljer> = {}): ProduktDetaljer => ({
  Navn: 'Metformin "Orion"',
  Varenummer: '052847',
  Styrke: '500 mg',
  Pakning: '100 stk.',
  VirksomtStof: 'Metformin',
  Firma: 'Orion',
  AtcKode: 'A10BA02',
  PrisPrPakning: 44.5,
  PrisPrEnhed: 0.45,
  AIP: 17.52,
  TilskudBeregnesAf: 39.95,
  Udgaaet: false,
  UdgaaetDato: null,
  Substitutioner: [],
  ...overrides,
})

describe('assembleBriefing', () => {
  it('selects the result matching the requested strength', async () => {
    const items = [
      makeSearchItem({ Varenummer: '001', Styrke: '250 mg' }),
      makeSearchItem({ Varenummer: '002', Styrke: '500 mg' }),
      makeSearchItem({ Varenummer: '003', Styrke: '1000 mg' }),
    ]

    const client: MedicinpriserClient = {
      searchBySubstance: async () => ({ ok: true, data: items }),
      searchByName: async () => ({ ok: true, data: [] }),
      getDetail: async (vnr) => ({
        ok: true,
        data: makeDetail({
          Varenummer: vnr,
          Styrke: items.find((i) => i.Varenummer === vnr)?.Styrke ?? '500 mg',
          Substitutioner: [],
        }),
      }),
    }

    const result = await assembleBriefing({ substance: 'metformin', strength: '500 mg' }, client)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.anchor.Varenummer).toBe('002')
    }
  })

  it('falls back to first result when no strength matches', async () => {
    const items = [
      makeSearchItem({ Varenummer: '011', Styrke: '500 mg' }),
      makeSearchItem({ Varenummer: '012', Styrke: '1000 mg' }),
    ]

    const client: MedicinpriserClient = {
      searchBySubstance: async () => ({ ok: true, data: items }),
      searchByName: async () => ({ ok: true, data: [] }),
      getDetail: async (vnr) => ({ ok: true, data: makeDetail({ Varenummer: vnr, Substitutioner: [] }) }),
    }

    const result = await assembleBriefing({ substance: 'metformin', strength: '250 mg' }, client)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.anchor.Varenummer).toBe('011')
    }
  })

  it('falls back to name search when substance search returns empty', async () => {
    const nameResults = [makeSearchItem({ Varenummer: '041', Navn: 'Glucophage' })]
    const searchByNameCalled: string[] = []

    const client: MedicinpriserClient = {
      searchBySubstance: async () => ({ ok: true, data: [] }),
      searchByName: async (navn) => {
        searchByNameCalled.push(navn)
        return { ok: true, data: nameResults }
      },
      getDetail: async (vnr) => ({ ok: true, data: makeDetail({ Varenummer: vnr, Substitutioner: [] }) }),
    }

    const result = await assembleBriefing({ substance: 'glucophage', brandName: 'Glucophage' }, client)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.anchor.Varenummer).toBe('041')
    }
    expect(searchByNameCalled).toContain('Glucophage')
  })

  it('returns ok:false when no products are found', async () => {
    const client: MedicinpriserClient = {
      searchBySubstance: async () => ({ ok: true, data: [] }),
      searchByName: async () => ({ ok: true, data: [] }),
      getDetail: async () => ({ ok: false, error: 'not found', raw: null }),
    }

    const result = await assembleBriefing({ substance: 'unknowndrug', brandName: 'unknowndrug' }, client)
    expect(result.ok).toBe(false)
  })

  it('removes discontinued substitutes and captures their names in removed[]', async () => {
    const subItems = [
      makeSearchItem({ Varenummer: '051', Navn: 'Sub A' }),
      makeSearchItem({ Varenummer: '052', Navn: 'Udgaaet Sub B' }),
    ]
    const anchorDetail = makeDetail({ Varenummer: '001', Substitutioner: subItems })

    const client: MedicinpriserClient = {
      searchBySubstance: async () => ({ ok: true, data: [makeSearchItem({ Varenummer: '001' })] }),
      searchByName: async () => ({ ok: true, data: [] }),
      getDetail: async (vnr) => {
        if (vnr === '001') return { ok: true, data: anchorDetail }
        if (vnr === '051') return { ok: true, data: makeDetail({ Varenummer: '051', Navn: 'Sub A', Udgaaet: false }) }
        if (vnr === '052')
          return {
            ok: true,
            data: makeDetail({
              Varenummer: '052',
              Navn: 'Udgaaet Sub B',
              Udgaaet: true,
              PrisPrEnhed: null,
              PrisPrPakning: null,
              TilskudBeregnesAf: null,
            }),
          }
        return { ok: false, error: 'not found', raw: null }
      },
    }

    const result = await assembleBriefing({ substance: 'metformin' }, client)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.removed).toHaveLength(1)
      expect(result.data.removed[0].Navn).toBe('Udgaaet Sub B')
      expect(result.data.ranked.some((p) => p.Varenummer === '052')).toBe(false)
    }
  })

  it('ranks products ascending by PrisPrEnhed with nulls last', async () => {
    const subVnrs = ['061', '062', '063']
    const subItems = subVnrs.map((vnr) => makeSearchItem({ Varenummer: vnr }))
    const anchorDetail = makeDetail({ Varenummer: '060', PrisPrEnhed: 0.80, Substitutioner: subItems })

    const priceByVnr: Record<string, number | null> = {
      '060': 0.80,
      '061': 0.45,
      '062': null,
      '063': 1.20,
    }

    const client: MedicinpriserClient = {
      searchBySubstance: async () => ({ ok: true, data: [makeSearchItem({ Varenummer: '060' })] }),
      searchByName: async () => ({ ok: true, data: [] }),
      getDetail: async (vnr) => {
        if (vnr === '060') return { ok: true, data: anchorDetail }
        const ppe = vnr in priceByVnr ? priceByVnr[vnr] : 0.5
        return { ok: true, data: makeDetail({ Varenummer: vnr, PrisPrEnhed: ppe }) }
      },
    }

    const result = await assembleBriefing({ substance: 'metformin' }, client)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const prices = result.data.ranked.map((p) => p.PrisPrEnhed)
      expect(prices[prices.length - 1]).toBeNull()
      const nonNull = prices.filter((p): p is number => p !== null)
      expect(nonNull).toEqual([...nonNull].sort((a, b) => a - b))
      expect(nonNull[0]).toBe(0.45)
    }
  })

  it('populates deltaPct from computeReimbursementDelta', async () => {
    const sub = makeSearchItem({ Varenummer: '071' })
    const anchorDetail = makeDetail({
      Varenummer: '070',
      TilskudBeregnesAf: 39.95,
      Substitutioner: [sub],
    })
    const subDetail = makeDetail({ Varenummer: '071', AIP: 17.52 })

    const client: MedicinpriserClient = {
      searchBySubstance: async () => ({ ok: true, data: [makeSearchItem({ Varenummer: '070' })] }),
      searchByName: async () => ({ ok: true, data: [] }),
      getDetail: async (vnr) => {
        if (vnr === '070') return { ok: true, data: anchorDetail }
        return { ok: true, data: subDetail }
      },
    }

    const result = await assembleBriefing({ substance: 'metformin' }, client)
    expect(result.ok).toBe(true)
    if (result.ok) {
      // (39.95 - 17.52) / 17.52 * 100 ≈ 128.02
      expect(result.data.deltaPct).toBeCloseTo(128.02, 0)
    }
  })

  it('caps substitute detail fetches at 6', async () => {
    const tenSubs = Array.from({ length: 10 }, (_, i) =>
      makeSearchItem({ Varenummer: `08${i}` }),
    )
    const anchorDetail = makeDetail({ Varenummer: '080a', Substitutioner: tenSubs })

    const getDetailCalls: string[] = []
    const client: MedicinpriserClient = {
      searchBySubstance: async () => ({ ok: true, data: [makeSearchItem({ Varenummer: '080a' })] }),
      searchByName: async () => ({ ok: true, data: [] }),
      getDetail: async (vnr) => {
        getDetailCalls.push(vnr)
        if (vnr === '080a') return { ok: true, data: anchorDetail }
        return { ok: true, data: makeDetail({ Varenummer: vnr }) }
      },
    }

    await assembleBriefing({ substance: 'metformin' }, client)
    // 1 anchor + max 6 subs = 7 total
    expect(getDetailCalls).toHaveLength(7)
  })

  it('emits step events during assembly', async () => {
    const items = [makeSearchItem({ Varenummer: '091' })]
    const anchorDetail = makeDetail({ Varenummer: '091', Substitutioner: [] })

    const client: MedicinpriserClient = {
      searchBySubstance: async () => ({ ok: true, data: items }),
      searchByName: async () => ({ ok: true, data: [] }),
      getDetail: async () => ({ ok: true, data: anchorDetail }),
    }

    const steps: { dir: 'in' | 'out'; text: string }[] = []
    await assembleBriefing({ substance: 'metformin' }, client, (dir, text) => {
      steps.push({ dir, text })
    })

    expect(steps.some((s) => s.dir === 'in')).toBe(true)
    expect(steps.some((s) => s.dir === 'out')).toBe(true)
  })
})
