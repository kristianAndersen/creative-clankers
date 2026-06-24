/**
 * Zod schemas and TypeScript types derived from live medicinpriser.dk API responses.
 *
 * Key observations from live data (2026-06-24):
 * - Search endpoint items (both substance and name): Navn, Varenummer, Firma, Styrke, Detaljer, Pakning
 *   No Udgaaet field on search results.
 * - Detail endpoint: PrisPrPakning, PrisPrEnhed, TilskudBeregnesAf are null when Udgaaet === true.
 *   AIP may still be populated even for discontinued products.
 * - Substitutioner is an array of objects (same shape as search items), NOT an array of VNR strings.
 *   The VNR is at Substitutioner[i].Varenummer.
 * - UdgaaetDato uses ASP.NET /Date(ms)/ format when present.
 * - Prices are dot-decimal numbers (e.g. 44.5, 0.45), never string-encoded in practice.
 * - IMPORTANT: prices are actual DKK kroner (not thousands). Do NOT multiply by 1000.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Shared sub-schemas
// ---------------------------------------------------------------------------

/**
 * A single search result item, returned by both searchBySubstance and searchByName.
 * No Udgaaet field — discontinued status is only on the detail record.
 */
export const ProduktSearchItemSchema = z.object({
  Navn: z.string(),
  Varenummer: z.string(),
  Firma: z.string(),
  Styrke: z.string(),
  Detaljer: z.string(),
  Pakning: z.string(),
})

export type ProduktSearchItem = z.infer<typeof ProduktSearchItemSchema>

/**
 * A substitute item inside a detail record's Substitutioner array.
 * Same shape as ProduktSearchItemSchema.
 */
export const SubstitutionItemSchema = z.object({
  Navn: z.string(),
  Varenummer: z.string(),
  Firma: z.string(),
  Styrke: z.string(),
  Detaljer: z.string(),
  Pakning: z.string(),
})

export type SubstitutionItem = z.infer<typeof SubstitutionItemSchema>

// ---------------------------------------------------------------------------
// Detail schema
// ---------------------------------------------------------------------------

/**
 * Full product detail record from GET /produkter/detaljer/{vnr}.
 *
 * Price fields that can be null:
 *   - PrisPrPakning: null when Udgaaet === true
 *   - PrisPrEnhed: null when Udgaaet === true
 *   - TilskudBeregnesAf: null when Udgaaet === true
 *
 * AIP may still be populated even when Udgaaet === true.
 *
 * Chip-able price fields (raw DKK, actual value — not in thousands):
 *   - PrisPrPakning: number | null  — retail price per pack
 *   - PrisPrEnhed:   number | null  — retail price per unit
 *   - AIP:           number | null  — pharmacy purchase price
 *   - TilskudBeregnesAf: number | null — reimbursement basis price
 */
export const ProduktDetaljerSchema = z.object({
  Navn: z.string(),
  Varenummer: z.string(),
  Styrke: z.string(),
  Pakning: z.string(),
  VirksomtStof: z.string(),
  Firma: z.string(),
  AtcKode: z.string(),

  // Price fields — null when product is discontinued
  PrisPrPakning: z.number().nullable(),
  PrisPrEnhed: z.number().nullable(),
  AIP: z.number().nullable(),
  TilskudBeregnesAf: z.number().nullable(),

  // Discontinued status
  Udgaaet: z.boolean(),
  UdgaaetDato: z.string().nullable(), // ASP.NET /Date(ms)/ format or null

  // Substitutes — array of objects (VNR is at .Varenummer)
  Substitutioner: z.array(SubstitutionItemSchema),

  // Cheaper combinations (same shape as Substitutioner)
  BilligereKombinationer: z.array(SubstitutionItemSchema).optional(),

  // Reimbursement
  TilskudKode: z.string().nullable().optional(),
  TilskudTekst: z.string().nullable().optional(),

  // Clinical (never output as recommendations)
  Dosering: z.string().nullable().optional(),
  Indikation: z.string().nullable().optional(),
  DDD: z.number().nullable().optional(),

  // Dispensing / logistics
  Dosisdispensering: z.boolean().optional(),
  Udleveringsgruppe: z.string().optional(),
  TrafikAdvarsel: z.boolean().optional(),
  Haandkoeb: z.boolean().optional(),
  Opbevaringsbetingelser: z.string().optional(),
  NbsSpeciale: z.string().optional(),
})

export type ProduktDetaljer = z.infer<typeof ProduktDetaljerSchema>

// ---------------------------------------------------------------------------
// Array wrappers (for parse-safe client functions)
// ---------------------------------------------------------------------------

export const ProduktSearchResultSchema = z.array(ProduktSearchItemSchema)
export type ProduktSearchResult = z.infer<typeof ProduktSearchResultSchema>

// ---------------------------------------------------------------------------
// Client result union — every public function returns this
// ---------------------------------------------------------------------------

export type ApiSuccess<T> = { ok: true; data: T; cached?: boolean; cachedAt?: number }
export type ApiError = { ok: false; error: string; raw: unknown }
export type ApiResult<T> = ApiSuccess<T> | ApiError
