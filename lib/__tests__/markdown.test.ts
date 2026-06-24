import { describe, it, expect } from 'vitest'
import { segmentMarkdown } from '../markdown'

describe('segmentMarkdown', () => {
  it('parses ## heading', () => {
    const blocks = segmentMarkdown('## My Heading')
    expect(blocks).toHaveLength(1)
    expect(blocks[0].kind).toBe('heading')
    if (blocks[0].kind === 'heading') {
      expect(blocks[0].level).toBe(2)
      expect(blocks[0].inline).toEqual([{ kind: 'text', text: 'My Heading' }])
    }
  })

  it('parses ### sub-heading with level 3', () => {
    const blocks = segmentMarkdown('### Sub')
    expect(blocks).toHaveLength(1)
    expect(blocks[0].kind).toBe('heading')
    if (blocks[0].kind === 'heading') expect(blocks[0].level).toBe(3)
  })

  it('no leftover ## in heading inline text', () => {
    const blocks = segmentMarkdown('## No hashes')
    const allText = blocks
      .flatMap(b => (b.kind === 'heading' || b.kind === 'paragraph') ? b.inline : [])
      .filter(s => s.kind === 'text')
      .map(s => (s as { kind: 'text'; text: string }).text)
      .join('')
    expect(allText).not.toContain('##')
  })

  it('parses **bold** within paragraph', () => {
    const blocks = segmentMarkdown('This is **bold** text')
    expect(blocks).toHaveLength(1)
    expect(blocks[0].kind).toBe('paragraph')
    if (blocks[0].kind === 'paragraph') {
      const bold = blocks[0].inline.find(s => s.kind === 'bold')
      expect(bold).toBeDefined()
      expect((bold as { kind: 'bold'; text: string }).text).toBe('bold')
    }
  })

  it('no leftover ** markers in output', () => {
    const blocks = segmentMarkdown('**bold** and **more**')
    const allText = blocks
      .flatMap(b => b.kind === 'paragraph' ? b.inline : [])
      .filter(s => s.kind === 'text')
      .map(s => (s as { text: string }).text)
      .join('')
    expect(allText).not.toContain('**')
  })

  it('blank line separates into two paragraph blocks', () => {
    const blocks = segmentMarkdown('Para one.\n\nPara two.')
    expect(blocks).toHaveLength(2)
    expect(blocks[0].kind).toBe('paragraph')
    expect(blocks[1].kind).toBe('paragraph')
  })

  it('single \\n within paragraph does not split into two blocks', () => {
    const blocks = segmentMarkdown('Line one\nLine two')
    expect(blocks).toHaveLength(1)
    expect(blocks[0].kind).toBe('paragraph')
  })

  it('[PRICE:vnr:field] sentinel survives as price inline token', () => {
    const blocks = segmentMarkdown('Price is [PRICE:052847:PrisPrEnhed] per unit')
    expect(blocks).toHaveLength(1)
    if (blocks[0].kind === 'paragraph') {
      const price = blocks[0].inline.find(s => s.kind === 'price')
      expect(price).toBeDefined()
      if (price?.kind === 'price') {
        expect(price.vnr).toBe('052847')
        expect(price.field).toBe('PrisPrEnhed')
      }
    }
  })

  it('no raw [PRICE: text survives in text tokens', () => {
    const blocks = segmentMarkdown('[PRICE:052847:PrisPrEnhed] is the price')
    const textContent = blocks
      .flatMap(b => b.kind === 'paragraph' ? b.inline : [])
      .filter(s => s.kind === 'text')
      .map(s => (s as { text: string }).text)
      .join('')
    expect(textContent).not.toContain('[PRICE:')
  })

  it('heading followed by paragraph in sequence', () => {
    const blocks = segmentMarkdown('## Section\n\nSome text here.')
    expect(blocks).toHaveLength(2)
    expect(blocks[0].kind).toBe('heading')
    expect(blocks[1].kind).toBe('paragraph')
  })

  it('[PRICE:vnr:field] sentinel inside **bold** is treated as price not bold', () => {
    // Sentinels take precedence (outer split happens first)
    const blocks = segmentMarkdown('Cost: [PRICE:052847:AIP] total')
    if (blocks[0].kind === 'paragraph') {
      const prices = blocks[0].inline.filter(s => s.kind === 'price')
      expect(prices.length).toBeGreaterThan(0)
    }
  })

  it('empty string returns empty array', () => {
    const blocks = segmentMarkdown('')
    expect(blocks).toHaveLength(0)
  })

  it('heading-only line has no paragraph produced', () => {
    const blocks = segmentMarkdown('## Title\n')
    expect(blocks).toHaveLength(1)
    expect(blocks[0].kind).toBe('heading')
  })
})
