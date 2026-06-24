/**
 * Pure prose-parsing utilities for the Substitution Briefing Agent and
 * Sundhedsradar Narrate Agent.
 *
 * Sentinel formats:
 *
 *   [PRICE:vnr:field]
 *     vnr   — 6-digit varenummer (string)
 *     field — one of: PrisPrPakning, PrisPrEnhed, AIP, TilskudBeregnesAf
 *
 *   [SRC:source:table:kommuneKode:field]
 *     source      — data provider: dst | ssi | dmi | eng
 *     table       — table/dataset name (e.g. folk1a, medi1, wastewater, weather, signal)
 *     kommuneKode — 4-digit Danish municipality code (e.g. 0101)
 *     field       — field name within the dataset (e.g. totalPopulation, score, meanTempC)
 *
 * Public API:
 *   parseProse(text)                   → ProseToken[]
 *   toPlainText(tokens, prices)        → string  (clipboard export — no sentinels)
 *   lockLooseNumbers(text, prices)     → string  (replaces bare number matches with sentinels)
 *
 * Chip-able price fields (raw DKK — NOT multiplied by 1000):
 *   PrisPrPakning, PrisPrEnhed, AIP, TilskudBeregnesAf
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TextToken = { type: 'text'; text: string }
export type PriceToken = { type: 'price'; vnr: string; field: string }
export type SrcToken = {
  type: 'src'
  source: string
  table: string
  kommuneKode: string
  field: string
}
export type ProseToken = TextToken | PriceToken | SrcToken

/** PriceData map shape: vnr → { fieldName: number | null } */
export type PriceData = Record<string, number | null>

// ---------------------------------------------------------------------------
// Sentinel regexes
// ---------------------------------------------------------------------------

const PRICE_SENTINEL_SOURCE = /\[PRICE:(\w+):(\w+)\]/g.source
const SRC_SENTINEL_SOURCE = /\[SRC:([^:\]]+):([^:\]]+):([^:\]]+):([^:\]]+)\]/g.source

// Combined alternation: price sentinels before src sentinels to preserve
// left-to-right priority when both appear at the same position (impossible in
// practice, but explicit ordering avoids ambiguity).
const COMBINED_SENTINEL_RE = new RegExp(
  `${PRICE_SENTINEL_SOURCE}|${SRC_SENTINEL_SOURCE}`,
  'g',
)

// ---------------------------------------------------------------------------
// parseProse
// ---------------------------------------------------------------------------

/**
 * Split prose text around [PRICE:vnr:field] and [SRC:source:table:kommuneKode:field]
 * sentinels. Returns an ordered array of text, price, and src tokens.
 * Empty text segments are omitted. Backward-compatible: existing [PRICE:] behaviour
 * and all callers are unaffected by the addition of the SRC branch.
 */
export function parseProse(text: string): ProseToken[] {
  const tokens: ProseToken[] = []
  let lastIndex = 0
  const re = new RegExp(COMBINED_SENTINEL_RE.source, 'g')
  let match: RegExpExecArray | null

  while ((match = re.exec(text)) !== null) {
    // Text before this sentinel
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }

    if (match[1] !== undefined) {
      // PRICE sentinel: groups 1 (vnr) and 2 (field) are defined
      tokens.push({ type: 'price', vnr: match[1], field: match[2] })
    } else {
      // SRC sentinel: groups 3 (source), 4 (table), 5 (kommuneKode), 6 (field)
      tokens.push({
        type: 'src',
        source: match[3],
        table: match[4],
        kommuneKode: match[5],
        field: match[6],
      })
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text after last sentinel
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return tokens
}

// ---------------------------------------------------------------------------
// toPlainText
// ---------------------------------------------------------------------------

/**
 * Render a token array to plain text for clipboard export.
 * Price tokens are replaced with the raw value from the prices map.
 * SrcTokens are rendered as "[source:table:kommuneKode:field]" (no data map available).
 * Unmatched VNR or null field value → "?".
 * No markdown, no sentinel notation in output.
 */
export function toPlainText(tokens: ProseToken[], prices: Map<string, PriceData>): string {
  return tokens
    .map((token) => {
      if (token.type === 'text') return token.text
      if (token.type === 'src') {
        // SRC tokens have no backing price map — render as compact reference
        return `[${token.source}:${token.table}:${token.kommuneKode}:${token.field}]`
      }
      // price token
      const priceData = prices.get(token.vnr)
      if (!priceData) return '?'
      const value = priceData[token.field]
      if (value === null || value === undefined) return '?'
      return String(value)
    })
    .join('')
}

// ---------------------------------------------------------------------------
// lockLooseNumbers
// ---------------------------------------------------------------------------

/**
 * Numeric post-pass: find bare decimal numbers in text that match a known
 * price value in the prices map, and replace them with [PRICE:vnr:field]
 * sentinels.
 *
 * This is the robustness fallback for when the LLM skips sentinel emission.
 *
 * Matching strategy:
 *   1. Find all decimal-looking substrings: /\b\d+[.,]\d+\b/g
 *      (includes both dot and comma separators, e.g. "44.50" and "44,50")
 *   2. Normalise: replace comma with dot, then parseFloat
 *   3. Compare against every (vnr, field, value) triple in prices
 *   4. On match: replace the literal substring with [PRICE:vnr:field]
 *
 * No false positives on non-decimal integers (e.g. "2021", "500 mg") since
 * the regex requires at least one decimal digit after the separator.
 *
 * When multiple price fields match the same number, the first match (by
 * iteration order) wins — this is deterministic for a given Map insertion order.
 */
export function lockLooseNumbers(text: string, prices: Map<string, PriceData>): string {
  if (prices.size === 0) return text

  // Build a lookup: normalised numeric value → [vnr, field]
  // We build this once per call, not per match.
  const lookup = new Map<number, { vnr: string; field: string }>()
  for (const [vnr, data] of prices.entries()) {
    for (const [field, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        // Only index chip-able fields
        if (['PrisPrPakning', 'PrisPrEnhed', 'AIP', 'TilskudBeregnesAf'].includes(field)) {
          // Use the numeric value as key; if two fields share a value, first one wins
          if (!lookup.has(value)) {
            lookup.set(value, { vnr, field })
          }
        }
      }
    }
  }

  if (lookup.size === 0) return text

  // Replace decimal substrings that match a known price
  // \b\d+[.,]\d+\b — word boundary, digits, dot or comma, digits, word boundary
  return text.replace(/\b\d+[.,]\d+\b/g, (match) => {
    const normalised = parseFloat(match.replace(',', '.'))
    if (isNaN(normalised)) return match
    const hit = lookup.get(normalised)
    if (!hit) return match
    return `[PRICE:${hit.vnr}:${hit.field}]`
  })
}
