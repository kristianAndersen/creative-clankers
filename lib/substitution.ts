import { computeReimbursementDelta } from './medicinpriser'
import type {
  ApiResult,
  ProduktDetaljer,
  ProduktSearchResult,
} from './medicinpriser.types'

// Identity fields emitted as data-ranked for deterministic UI table rendering.
export type RankedRow = {
  vnr: string
  Navn: string
  Firma: string
  Styrke: string
  Pakning: string
}

export type PriceMapEntry = {
  Navn: string
  Varenummer: string
  Firma: string
  Styrke: string
  Pakning: string
  PrisPrPakning: number | null
  PrisPrEnhed: number | null
  AIP: number | null
  TilskudBeregnesAf: number | null
  Udgaaet: boolean
}

export type MedicinpriserClient = {
  searchBySubstance(stof: string): Promise<ApiResult<ProduktSearchResult>>
  searchByName(navn: string): Promise<ApiResult<ProduktSearchResult>>
  getDetail(vnr: string): Promise<ApiResult<ProduktDetaljer>>
}

export type StepEmitter = (dir: 'in' | 'out', text: string) => void

export type AssembledBriefing =
  | { ok: false; error: string }
  | {
      ok: true
      data: {
        anchor: ProduktDetaljer
        ranked: PriceMapEntry[]
        removed: { Navn: string }[]
        deltaPct: number | null
        priceMap: Record<string, PriceMapEntry>
      }
    }

const MAX_SUBS = 6

function toPriceEntry(d: ProduktDetaljer): PriceMapEntry {
  return {
    Navn: d.Navn,
    Varenummer: d.Varenummer,
    Firma: d.Firma,
    Styrke: d.Styrke,
    Pakning: d.Pakning,
    PrisPrPakning: d.PrisPrPakning,
    PrisPrEnhed: d.PrisPrEnhed,
    AIP: d.AIP,
    TilskudBeregnesAf: d.TilskudBeregnesAf,
    Udgaaet: d.Udgaaet,
  }
}

export async function assembleBriefing(
  intent: { substance?: string; brandName?: string; strength?: string },
  client: MedicinpriserClient,
  emit?: StepEmitter,
): Promise<AssembledBriefing> {
  // Step 1: Search
  let results: ProduktSearchResult = []

  if (intent.substance) {
    emit?.('in', `Searching substance: ${intent.substance}…`)
    const r = await client.searchBySubstance(intent.substance)
    if (r.ok) results = r.data
    emit?.('out', `Found ${results.length} result${results.length !== 1 ? 's' : ''}`)
  }

  if (results.length === 0 && intent.brandName) {
    emit?.('in', `Searching name: ${intent.brandName}…`)
    const r = await client.searchByName(intent.brandName)
    if (r.ok) results = r.data
    emit?.('out', `Found ${results.length} result${results.length !== 1 ? 's' : ''}`)
  }

  if (results.length === 0) {
    return { ok: false, error: 'No products found' }
  }

  // Step 2: Pick anchor — prefer strength match
  let anchor = results[0]
  if (intent.strength) {
    const norm = intent.strength.toLowerCase().replace(/\s/g, '')
    const match = results.find((r) => r.Styrke.toLowerCase().replace(/\s/g, '') === norm)
    if (match) anchor = match
  }

  // Step 3: Fetch anchor detail
  emit?.('in', `Fetching anchor: ${anchor.Navn}…`)
  const anchorResult = await client.getDetail(anchor.Varenummer)
  if (!anchorResult.ok) {
    return { ok: false, error: `Could not fetch anchor detail: ${anchorResult.error}` }
  }
  const anchorDetail = anchorResult.data
  emit?.('out', `Fetched ${anchorDetail.Navn}`)

  // Step 4: Fetch substitutes in parallel, capped at MAX_SUBS
  const subsToFetch = (anchorDetail.Substitutioner ?? []).slice(0, MAX_SUBS)
  let subDetails: ProduktDetaljer[] = []

  if (subsToFetch.length > 0) {
    emit?.('in', `Fetching ${subsToFetch.length} substitute${subsToFetch.length !== 1 ? 's' : ''}…`)
    const subResults = await Promise.all(subsToFetch.map((s) => client.getDetail(s.Varenummer)))
    subDetails = subResults
      .filter((r): r is { ok: true; data: ProduktDetaljer } => r.ok)
      .map((r) => r.data)
  }

  // Step 5: Separate discontinued from active
  const removed: { Navn: string }[] = []
  const activeDetails: ProduktDetaljer[] = []
  for (const d of subDetails) {
    if (d.Udgaaet) {
      removed.push({ Navn: d.Navn })
    } else {
      activeDetails.push(d)
    }
  }
  if (removed.length > 0) {
    emit?.('out', `Filtered ${removed.length} discontinued product${removed.length !== 1 ? 's' : ''}`)
  }

  // Step 6: Rank by PrisPrEnhed ascending, nulls last
  const allProducts = [anchorDetail, ...activeDetails]
  const ranked = allProducts.map(toPriceEntry).sort((a, b) => {
    if (a.PrisPrEnhed === null && b.PrisPrEnhed === null) return 0
    if (a.PrisPrEnhed === null) return 1
    if (b.PrisPrEnhed === null) return -1
    return a.PrisPrEnhed - b.PrisPrEnhed
  })
  emit?.('out', `Ranked ${ranked.length} product${ranked.length !== 1 ? 's' : ''}`)

  // Step 7: Delta
  const deltaPct = computeReimbursementDelta(anchorDetail, activeDetails)

  // Build price map (ranked + discontinued for completeness)
  const priceMap: Record<string, PriceMapEntry> = {}
  for (const p of ranked) priceMap[p.Varenummer] = p
  for (const d of subDetails) {
    if (d.Udgaaet) priceMap[d.Varenummer] = toPriceEntry(d)
  }

  return {
    ok: true,
    data: { anchor: anchorDetail, ranked, removed, deltaPct, priceMap },
  }
}
