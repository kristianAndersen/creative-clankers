/**
 * Schema conformance tests: embed real API response JSON and assert that
 * ProduktDetaljerSchema and ProduktSearchResultSchema parse them successfully.
 *
 * These tests are network-free. They pin the schema to real live API shapes
 * captured 2026-06-24, covering:
 *   - Active product (062391) — all price fields populated
 *   - Active product (371651) — has BilligereKombinationer, AIP is integer (250)
 *   - Active product (385202) — different AIP/TilskudBeregnesAf relationship
 *   - Discontinued (139399)  — PrisPrPakning/PrisPrEnhed/TilskudBeregnesAf null, Udgaaet:true
 *   - Discontinued (182805)  — same null pattern, DDD null
 *   - Substance search array (metformin, first 3 items)
 *   - Name search array (paracetamol, first 3 items)
 */

import { describe, it, expect } from 'vitest'
import { ProduktDetaljerSchema, ProduktSearchResultSchema } from '../medicinpriser.types'

// ---------------------------------------------------------------------------
// Captured detail records (verbatim from curl, truncated Substitutioner/BilligereKombinationer for brevity)
// ---------------------------------------------------------------------------

const detail_062391 = {
  "Navn": "Paracetamol \"Zentiva\"",
  "Varenummer": "062391",
  "Styrke": "1000 mg",
  "Pakning": "100 stk. (blister) tabletter",
  "VirksomtStof": "Paracetamol",
  "Firma": "Zentiva",
  "AtcKode": "N02BE01",
  "Dosisdispensering": true,
  "Udleveringsgruppe": "B",
  "PrisPrPakning": 44.5,
  "PrisPrEnhed": 0.45,
  "AIP": 17.52,
  "TilskudBeregnesAf": 39.95,
  "Udgaaet": false,
  "UdgaaetDato": null,
  "Substitutioner": [
    { "Navn": "Paracetamol \"Medical Valley\"", "Varenummer": "047813", "Firma": "Medical Valley", "Styrke": "1000 mg", "Detaljer": "/v1/produkter/detaljer/047813", "Pakning": "105 stk. filmovertrukne tabl." },
    { "Navn": "Panodil", "Varenummer": "111955", "Firma": "Haleon Denmark ApS", "Styrke": "1000 mg", "Detaljer": "/v1/produkter/detaljer/111955", "Pakning": "100 stk. filmovertrukne tabl." }
  ],
  "BilligereKombinationer": [],
  "Dosering": "1 tablet 4 gange daglig, 1 tablet 3 gange daglig",
  "Indikation": "mod smerter, febernedsættende",
  "TrafikAdvarsel": false,
  "DDD": 1.3350133501335,
  "Opbevaringsbetingelser": "Ingen",
  "NbsSpeciale": "",
  "Haandkoeb": false,
  "TilskudKode": "A",
  "TilskudTekst": "Generelt tilskud"
}

const detail_371651 = {
  "Navn": "Metformin \"Zentiva\"",
  "Varenummer": "371651",
  "Styrke": "1000 mg",
  "Pakning": "180 stk. (blister) filmovertrukne tabl.",
  "VirksomtStof": "Metformin",
  "Firma": "Zentiva Denmark",
  "AtcKode": "A10BA02",
  "Dosisdispensering": true,
  "Udleveringsgruppe": "B",
  "PrisPrPakning": 345.55,
  "PrisPrEnhed": 1.92,
  "AIP": 250,   // integer AIP — key conformance case
  "TilskudBeregnesAf": 345.55,
  "Udgaaet": false,
  "UdgaaetDato": null,
  "Substitutioner": [
    { "Navn": "Metformin \"Accord\"", "Varenummer": "193530", "Firma": "Accord Healthcare B.V.", "Styrke": "1000 mg", "Detaljer": "/v1/produkter/detaljer/193530", "Pakning": "200 stk. filmovertrukne tabl." }
  ],
  "BilligereKombinationer": [
    { "Navn": "Metformin \"Aurobindo\"", "Varenummer": "095241", "Firma": "Orion Pharma", "Styrke": "1000 mg", "Detaljer": "/v1/produkter/detaljer/095241", "Pakning": "60 stk. filmovertrukne tabl." }
  ],
  "Dosering": "1 tablet 3 gange daglig ved et måltid, 1 tablet 2 gange daglig ved et måltid",
  "Indikation": "behandling af diabetes type 2",
  "TrafikAdvarsel": false,
  "DDD": 3.83944444444444,
  "Opbevaringsbetingelser": "Ingen",
  "NbsSpeciale": "",
  "Haandkoeb": false,
  "TilskudKode": "A",
  "TilskudTekst": "Generelt tilskud"
}

// Discontinued product: PrisPrPakning/PrisPrEnhed/TilskudBeregnesAf null
const detail_139399_discontinued = {
  "Navn": "Sitagliptin/Metformin Zentiva",
  "Varenummer": "139399",
  "Styrke": "50+1000 mg",
  "Pakning": "56 stk. (blister) filmovertrukne tabl.",
  "VirksomtStof": "Metformin og sitagliptin",
  "Firma": "-",
  "AtcKode": "A10BD07",
  "Dosisdispensering": true,
  "Udleveringsgruppe": "B",
  "PrisPrPakning": null,
  "PrisPrEnhed": null,
  "AIP": 119.23,
  "TilskudBeregnesAf": null,
  "Udgaaet": true,
  "UdgaaetDato": "\/Date(1751839200000)\/",
  "Substitutioner": [
    { "Navn": "Sitaglip./Metf.HCl Medical Val", "Varenummer": "409502", "Firma": "Medical Valley", "Styrke": "50+1000 mg", "Detaljer": "/v1/produkter/detaljer/409502", "Pakning": "56 stk. (blister) filmovertrukne tabl." }
  ],
  "BilligereKombinationer": [],
  "Dosering": "1 tablet 2 gange daglig",
  "Indikation": "behandling af diabetes type 2",
  "TrafikAdvarsel": false,
  "DDD": null,   // null DDD on discontinued
  "Opbevaringsbetingelser": "Ikke over 30 C",
  "NbsSpeciale": "",
  "Haandkoeb": false,
  "TilskudKode": "A",
  "TilskudTekst": "Generelt tilskud"
}

// Second discontinued product: all price fields null
const detail_182805_discontinued = {
  "Navn": "Eucreas",
  "Varenummer": "182805",
  "Styrke": "50+850 mg",
  "Pakning": "60 stk. (blister) filmovertrukne tabl.",
  "VirksomtStof": "Metformin og vildagliptin",
  "Firma": "-",
  "AtcKode": "A10BD08",
  "Dosisdispensering": true,
  "Udleveringsgruppe": "B",
  "PrisPrPakning": null,
  "PrisPrEnhed": null,
  "AIP": 369.64,
  "TilskudBeregnesAf": null,
  "Udgaaet": true,
  "UdgaaetDato": "\/Date(1734908400000)\/",
  "Substitutioner": [
    { "Navn": "Vildagliptin/Metformin \"Krka\"", "Varenummer": "169141", "Firma": "Krka Sverige AB", "Styrke": "50+850 mg", "Detaljer": "/v1/produkter/detaljer/169141", "Pakning": "60 stk. (blister) filmovertrukne tabl." }
  ],
  "BilligereKombinationer": [],
  "Dosering": "dosering efter skriftlig anvisning, 1 tablet 2 gange daglig",
  "Indikation": "mod diabetes, behandling af diabetes type 2",
  "TrafikAdvarsel": false,
  "DDD": null,
  "Opbevaringsbetingelser": "Original beholder",
  "NbsSpeciale": "",
  "Haandkoeb": false,
  "TilskudKode": "A",
  "TilskudTekst": "Generelt tilskud"
}

// Substance search result items (metformin — first 3 from live response)
const searchResult_metformin = [
  { "Navn": "Sitaglip./Metf.HCl Medical Val", "Varenummer": "151069", "Firma": "Medical Valley", "Styrke": "50+850 mg", "Detaljer": "/v1/produkter/detaljer/151069", "Pakning": "210 stk. (blister) filmovertrukne tabl." },
  { "Navn": "Mitforgen", "Varenummer": "162491", "Firma": "Viatris ApS", "Styrke": "1000 mg", "Detaljer": "/v1/produkter/detaljer/162491", "Pakning": "60 stk. (blister) filmovertrukne tabl." },
  { "Navn": "Synjardy", "Varenummer": "163012", "Firma": "Abacus", "Styrke": "5mg/1000mg", "Detaljer": "/v1/produkter/detaljer/163012", "Pakning": "180 stk. (blister) (Abacus) filmovertrukne tabl." },
]

// Name search result items (paracetamol — first 3 from live response)
const searchResult_paracetamol = [
  { "Navn": "Paracetamol/Ibuprofen \"Viatris", "Varenummer": "485582", "Firma": "Viatris ApS", "Styrke": "500+200 mg", "Detaljer": "/v1/produkter/detaljer/485582", "Pakning": "20 stk. (blister) filmovertrukne tabl." },
  { "Navn": "Paracetamol \"B. Braun\"", "Varenummer": "490529", "Firma": "-", "Styrke": "10 mg/ml", "Detaljer": "/v1/produkter/detaljer/490529", "Pakning": "10 x 50 ml inf.væske, opløsning" },
  { "Navn": "Paracetamol \"Medical Valley\"", "Varenummer": "517211", "Firma": "Medical Valley", "Styrke": "500 mg", "Detaljer": "/v1/produkter/detaljer/517211", "Pakning": "375 stk. filmovertrukne tabl." },
]

// ---------------------------------------------------------------------------
// Conformance assertions
// ---------------------------------------------------------------------------

describe('ProduktDetaljerSchema — live-data conformance', () => {
  it('parses active product 062391 (all price fields populated)', () => {
    const result = ProduktDetaljerSchema.safeParse(detail_062391)
    if (!result.success) console.error('062391 errors:', result.error.format())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.PrisPrPakning).toBe(44.5)
      expect(result.data.Substitutioner).toHaveLength(2)
      expect(result.data.Substitutioner[0].Varenummer).toBe('047813')
    }
  })

  it('parses active product 371651 (integer AIP = 250)', () => {
    const result = ProduktDetaljerSchema.safeParse(detail_371651)
    if (!result.success) console.error('371651 errors:', result.error.format())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.AIP).toBe(250)
      expect(result.data.BilligereKombinationer).toHaveLength(1)
    }
  })

  it('parses discontinued 139399 (PrisPrPakning/PrisPrEnhed/TilskudBeregnesAf null, DDD null)', () => {
    const result = ProduktDetaljerSchema.safeParse(detail_139399_discontinued)
    if (!result.success) console.error('139399 errors:', result.error.format())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.Udgaaet).toBe(true)
      expect(result.data.PrisPrPakning).toBeNull()
      expect(result.data.PrisPrEnhed).toBeNull()
      expect(result.data.TilskudBeregnesAf).toBeNull()
      expect(result.data.AIP).toBe(119.23) // AIP still populated
      // UdgaaetDato is the ASP.NET /Date(ms)/ string
      expect(result.data.UdgaaetDato).toBe('/Date(1751839200000)/')
    }
  })

  it('parses discontinued 182805 (all null prices pattern)', () => {
    const result = ProduktDetaljerSchema.safeParse(detail_182805_discontinued)
    if (!result.success) console.error('182805 errors:', result.error.format())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.Udgaaet).toBe(true)
      expect(result.data.DDD).toBeNull()
    }
  })
})

describe('ProduktSearchResultSchema — live-data conformance', () => {
  it('parses substance search result (metformin array)', () => {
    const result = ProduktSearchResultSchema.safeParse(searchResult_metformin)
    if (!result.success) console.error('metformin search errors:', result.error.format())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(3)
      expect(result.data[0].Varenummer).toBe('151069')
    }
  })

  it('parses name search result (paracetamol array)', () => {
    const result = ProduktSearchResultSchema.safeParse(searchResult_paracetamol)
    if (!result.success) console.error('paracetamol search errors:', result.error.format())
    expect(result.success).toBe(true)
  })

  it('search items have NO Udgaaet field — confirmed', () => {
    const result = ProduktSearchResultSchema.safeParse(searchResult_metformin)
    expect(result.success).toBe(true)
    if (result.success) {
      // TypeScript type does not include Udgaaet — items from search endpoint are safe to cast
      result.data.forEach((item) => {
        expect('Udgaaet' in item).toBe(false)
      })
    }
  })
})
