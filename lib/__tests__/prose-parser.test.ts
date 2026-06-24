/**
 * Tests for lib/prose-parser.ts
 * TDD: written before implementation. Run to confirm red first.
 */

import { describe, it, expect } from 'vitest'
import { parseProse, toPlainText, lockLooseNumbers } from '../prose-parser'
import type { ProseToken } from '../prose-parser'

// ---------------------------------------------------------------------------
// parseProse — [PRICE:] sentinels (unchanged)
// ---------------------------------------------------------------------------

describe('parseProse', () => {
  it('plain text with no sentinels returns single text token', () => {
    const tokens = parseProse('plain text')
    expect(tokens).toEqual([{ type: 'text', text: 'plain text' }])
  })

  it('single sentinel returns three tokens: text, price, text', () => {
    const tokens = parseProse('price is [PRICE:052847:PrisPrEnhed] per unit')
    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toEqual({ type: 'text', text: 'price is ' })
    expect(tokens[1]).toEqual({ type: 'price', vnr: '052847', field: 'PrisPrEnhed' })
    expect(tokens[2]).toEqual({ type: 'text', text: ' per unit' })
  })

  it('multiple sentinels are all parsed in order', () => {
    const input =
      'First [PRICE:062391:PrisPrPakning] and second [PRICE:062391:AIP] done'
    const tokens = parseProse(input)
    const priceTokens = tokens.filter((t) => t.type === 'price')
    expect(priceTokens).toHaveLength(2)
    if (priceTokens[0].type === 'price') {
      expect(priceTokens[0].field).toBe('PrisPrPakning')
    }
    if (priceTokens[1].type === 'price') {
      expect(priceTokens[1].field).toBe('AIP')
    }
  })

  it('sentinel at start of string produces empty leading text token or skips it', () => {
    const tokens = parseProse('[PRICE:062391:AIP] is cheap')
    const priceTokens = tokens.filter((t) => t.type === 'price')
    expect(priceTokens).toHaveLength(1)
    // Either no leading empty text token, or an empty text token — implementation choice
    // What matters: the price token is present
    if (priceTokens[0].type === 'price') {
      expect(priceTokens[0].vnr).toBe('062391')
    }
  })

  it('sentinel at end of string produces empty trailing text token or skips it', () => {
    const tokens = parseProse('The price is [PRICE:062391:AIP]')
    const priceTokens = tokens.filter((t) => t.type === 'price')
    expect(priceTokens).toHaveLength(1)
    if (priceTokens[0].type === 'price') {
      expect(priceTokens[0].field).toBe('AIP')
    }
  })

  it('empty string returns empty array or single empty text token', () => {
    const tokens = parseProse('')
    // Acceptable: [] or [{ type: 'text', text: '' }]
    const nonEmpty = tokens.filter((t) => t.type === 'text' && (t as { text: string }).text.length > 0)
    expect(nonEmpty).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// parseProse — [SRC:] sentinels (new branch)
// ---------------------------------------------------------------------------

describe('parseProse — [SRC:] sentinels', () => {
  it('single [SRC:] sentinel is parsed into a src token with all four fields', () => {
    const tokens = parseProse(
      'I kommunen bor [SRC:dst:folk1a:0101:totalPopulation] borgere.',
    )
    const srcTokens = tokens.filter((t) => t.type === 'src')
    expect(srcTokens).toHaveLength(1)
    const tok = srcTokens[0]
    if (tok.type === 'src') {
      expect(tok.source).toBe('dst')
      expect(tok.table).toBe('folk1a')
      expect(tok.kommuneKode).toBe('0101')
      expect(tok.field).toBe('totalPopulation')
    }
  })

  it('src token at start of string is parsed without a leading text token', () => {
    const tokens = parseProse('[SRC:ssi:wastewater:0101:score] er forhøjet.')
    const srcTokens = tokens.filter((t) => t.type === 'src')
    expect(srcTokens).toHaveLength(1)
    // No leading empty text segment
    const textTokens = tokens.filter((t) => t.type === 'text' && (t as { text: string }).text.length > 0)
    expect(textTokens[0]).toMatchObject({ type: 'text', text: ' er forhøjet.' })
  })

  it('src token at end of string leaves no trailing empty text token', () => {
    const tokens = parseProse('Temperaturen er [SRC:dmi:weather:0151:meanTempC]')
    const srcTokens = tokens.filter((t) => t.type === 'src')
    expect(srcTokens).toHaveLength(1)
    const tok = srcTokens[0]
    if (tok.type === 'src') {
      expect(tok.source).toBe('dmi')
      expect(tok.table).toBe('weather')
      expect(tok.kommuneKode).toBe('0151')
      expect(tok.field).toBe('meanTempC')
    }
    // No trailing text token
    const last = tokens[tokens.length - 1]
    expect(last.type).toBe('src')
  })

  it('multiple [SRC:] sentinels from different sources are all parsed in order', () => {
    const input =
      'Folketal: [SRC:dst:folk1a:0101:totalPopulation]. Spildevand: [SRC:ssi:wastewater:0101:score]. Temp: [SRC:dmi:weather:0101:meanTempC].'
    const tokens = parseProse(input)
    const srcTokens = tokens.filter((t) => t.type === 'src')
    expect(srcTokens).toHaveLength(3)
    if (srcTokens[0].type === 'src') expect(srcTokens[0].source).toBe('dst')
    if (srcTokens[1].type === 'src') expect(srcTokens[1].source).toBe('ssi')
    if (srcTokens[2].type === 'src') expect(srcTokens[2].source).toBe('dmi')
  })

  it('eng source is treated like any other source', () => {
    const tokens = parseProse('Score: [SRC:eng:signal:0751:compositeScore].')
    const srcTokens = tokens.filter((t) => t.type === 'src')
    expect(srcTokens).toHaveLength(1)
    if (srcTokens[0].type === 'src') {
      expect(srcTokens[0].source).toBe('eng')
      expect(srcTokens[0].field).toBe('compositeScore')
    }
  })

  it('[PRICE:] and [SRC:] sentinels in the same string are both parsed in order', () => {
    const input =
      'Pris: [PRICE:052847:PrisPrEnhed]. Folketal: [SRC:dst:folk1a:0101:totalPopulation].'
    const tokens = parseProse(input)
    const priceTokens = tokens.filter((t) => t.type === 'price')
    const srcTokens = tokens.filter((t) => t.type === 'src')
    expect(priceTokens).toHaveLength(1)
    expect(srcTokens).toHaveLength(1)
    // Price appears before src in the string — its token index is lower
    const priceIdx = tokens.findIndex((t) => t.type === 'price')
    const srcIdx = tokens.findIndex((t) => t.type === 'src')
    expect(priceIdx).toBeLessThan(srcIdx)
  })

  it('malformed [SRC:] with fewer than four segments is not parsed as src token', () => {
    // Only 3 segments — should remain as plain text
    const tokens = parseProse('Broken [SRC:dst:folk1a:0101] sentinel')
    const srcTokens = tokens.filter((t) => t.type === 'src')
    expect(srcTokens).toHaveLength(0)
  })

  it('src token preserves kommuneKode with leading zeros', () => {
    const tokens = parseProse('[SRC:dst:medi1:0101:scriptsPerHundred]')
    const srcTokens = tokens.filter((t) => t.type === 'src')
    if (srcTokens[0].type === 'src') {
      expect(srcTokens[0].kommuneKode).toBe('0101')
    }
  })
})

// ---------------------------------------------------------------------------
// toPlainText (unchanged [PRICE:] behaviour)
// ---------------------------------------------------------------------------

describe('toPlainText', () => {
  it('replaces matched price token with raw value string', () => {
    const tokens = parseProse('price is [PRICE:062391:PrisPrEnhed] per unit')
    const prices = new Map([['062391', { PrisPrEnhed: 0.45, PrisPrPakning: 44.5, AIP: 17.52, TilskudBeregnesAf: 39.95 }]])
    const result = toPlainText(tokens, prices)
    expect(result).toBe('price is 0.45 per unit')
  })

  it('unmatched VNR returns "?" placeholder', () => {
    const tokens = parseProse('price is [PRICE:999999:PrisPrEnhed]')
    const prices = new Map<string, Record<string, number | null>>()
    const result = toPlainText(tokens, prices)
    expect(result).toContain('?')
  })

  it('output contains no [PRICE:...] sentinel notation', () => {
    const tokens = parseProse(
      'First [PRICE:062391:PrisPrPakning] and [PRICE:062391:AIP]'
    )
    const prices = new Map([
      ['062391', { PrisPrPakning: 44.5, PrisPrEnhed: 0.45, AIP: 17.52, TilskudBeregnesAf: 39.95 }],
    ])
    const result = toPlainText(tokens, prices)
    expect(result).not.toMatch(/\[PRICE:/)
  })

  it('plain tokens pass through unchanged', () => {
    const tokens: ProseToken[] = [{ type: 'text', text: 'hello world' }]
    const prices = new Map<string, Record<string, number | null>>()
    expect(toPlainText(tokens, prices)).toBe('hello world')
  })

  it('null price field renders as "?" not null/undefined literal', () => {
    const tokens = parseProse('[PRICE:139399:PrisPrPakning]')
    const prices = new Map([['139399', { PrisPrPakning: null, PrisPrEnhed: null, AIP: 119.23, TilskudBeregnesAf: null }]])
    const result = toPlainText(tokens, prices)
    // null field → "?" since we can't display null as a price
    expect(result).toMatch(/\?/)
    expect(result).not.toContain('null')
    expect(result).not.toContain('undefined')
  })

  it('src tokens render as compact [source:table:kommuneKode:field] reference', () => {
    const tokens = parseProse('Borgere: [SRC:dst:folk1a:0101:totalPopulation] i alt.')
    const prices = new Map<string, Record<string, number | null>>()
    const result = toPlainText(tokens, prices)
    // src tokens have no backing price map — renders a bracketed reference
    expect(result).toContain('[dst:folk1a:0101:totalPopulation]')
    // No raw [SRC:...] notation remains
    expect(result).not.toMatch(/\[SRC:/)
  })
})

// ---------------------------------------------------------------------------
// lockLooseNumbers (unchanged)
// ---------------------------------------------------------------------------

describe('lockLooseNumbers', () => {
  const prices = new Map([
    ['062391', { PrisPrPakning: 44.5, PrisPrEnhed: 0.45, AIP: 17.52, TilskudBeregnesAf: 39.95 }],
  ])

  it('replaces a dot-decimal number matching a known price value', () => {
    const result = lockLooseNumbers('The pack costs 44.50 today', prices)
    // 44.50 normalises to 44.5, matches PrisPrPakning for 062391
    expect(result).toContain('[PRICE:062391:PrisPrPakning]')
    expect(result).not.toContain('44.50')
  })

  it('replaces a comma-decimal number matching a known price (Danish locale)', () => {
    const result = lockLooseNumbers('Unit price is 0,45 per tablet', prices)
    // 0,45 normalises to 0.45, matches PrisPrEnhed for 062391
    expect(result).toContain('[PRICE:062391:PrisPrEnhed]')
  })

  it('does NOT replace numbers that have no match in prices', () => {
    const result = lockLooseNumbers('We have 500 mg in stock and step 2 is next', prices)
    // No matches for these non-price numbers
    expect(result).not.toContain('[PRICE:')
    expect(result).toContain('500')
  })

  it('does NOT produce false positives for years or non-price integers', () => {
    const result = lockLooseNumbers('Registered in 2021, not 2022.00', prices)
    // 2022.00 → 2022, no match in prices
    expect(result).not.toContain('[PRICE:')
  })

  it('returns original text unchanged when prices map is empty', () => {
    const result = lockLooseNumbers('price 44.50 here', new Map())
    expect(result).toBe('price 44.50 here')
  })
})
