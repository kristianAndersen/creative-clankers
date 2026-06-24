// Lightweight bespoke markdown segmenter for memo prose rendering.
// Supports: ## / ### headings, **bold**, blank-line paragraphs,
// single \n line breaks within a paragraph, and [PRICE:vnr:field] sentinels.
// No tables (table is rendered deterministically from data-ranked).
// No external dependencies.

export type MdInline =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'price'; vnr: string; field: string }

export type MdBlock =
  | { kind: 'heading'; level: 2 | 3; inline: MdInline[] }
  | { kind: 'paragraph'; inline: MdInline[] }

const PRICE_RE_SRC = /\[PRICE:(\w+):(\w+)\]/.source

function parseBold(text: string, out: MdInline[]): void {
  const boldRe = /\*\*(.+?)\*\*/g
  let lastIdx = 0
  let m: RegExpExecArray | null

  while ((m = boldRe.exec(text)) !== null) {
    if (m.index > lastIdx) {
      const t = text.slice(lastIdx, m.index)
      if (t) out.push({ kind: 'text', text: t })
    }
    out.push({ kind: 'bold', text: m[1] })
    lastIdx = m.index + m[0].length
  }

  if (lastIdx < text.length) {
    const t = text.slice(lastIdx)
    if (t) out.push({ kind: 'text', text: t })
  }
}

function parseInline(text: string): MdInline[] {
  const result: MdInline[] = []
  const priceRe = new RegExp(PRICE_RE_SRC, 'g')
  let lastIdx = 0
  let m: RegExpExecArray | null

  while ((m = priceRe.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parseBold(text.slice(lastIdx, m.index), result)
    }
    result.push({ kind: 'price', vnr: m[1], field: m[2] })
    lastIdx = m.index + m[0].length
  }

  if (lastIdx < text.length) {
    parseBold(text.slice(lastIdx), result)
  }

  return result
}

/**
 * Segment markdown text into structured blocks.
 * Heading lines (## / ###) become heading blocks.
 * Blank lines flush the current paragraph accumulator.
 * All other lines accumulate into a paragraph (joined with \n for single line breaks).
 * [PRICE:vnr:field] sentinels survive as price inline tokens.
 */
export function segmentMarkdown(text: string): MdBlock[] {
  const lines = text.split('\n')
  const blocks: MdBlock[] = []
  let paraLines: string[] = []

  function flushPara() {
    if (paraLines.length === 0) return
    const joined = paraLines.join('\n')
    const inline = parseInline(joined)
    if (inline.length > 0) blocks.push({ kind: 'paragraph', inline })
    paraLines = []
  }

  for (const line of lines) {
    if (line.startsWith('### ')) {
      flushPara()
      blocks.push({ kind: 'heading', level: 3, inline: parseInline(line.slice(4)) })
    } else if (line.startsWith('## ')) {
      flushPara()
      blocks.push({ kind: 'heading', level: 2, inline: parseInline(line.slice(3)) })
    } else if (line.trim() === '') {
      flushPara()
    } else {
      paraLines.push(line)
    }
  }
  flushPara()

  return blocks
}
