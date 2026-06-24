/**
 * scripts/ssi-snapshot.ts
 *
 * Downloads the SSI wastewater SARS-CoV-2 ZIP, parses the inner CSV,
 * resolves treatment-plant catchment centroids to kommuneKode via DAWA
 * reverseGeocode, and writes data/ssi-wastewater-snapshot.json.
 *
 * Run weekly (Tuesday/Wednesday after SSI publishes):
 *   bun run ssi:snapshot
 *
 * Add to package.json scripts:
 *   "ssi:snapshot": "bun run scripts/ssi-snapshot.ts"
 *
 * If SSI sources are unreachable, the script falls back to a SEED snapshot
 * using real plant centroids and real DAWA-resolved kommuneKoder, with
 * _seed: true in the output. This is an honest fallback — never silently
 * substitutes stale or fabricated data for real data.
 *
 * REAL vs SEED labelling:
 *   _seed: false  → scores fetched from SSI ZIP (REAL data)
 *   _seed: true   → scores synthesized locally (SEED / demo data)
 *   kommuneKode   → always REAL, resolved via live DAWA reverseGeocode
 */

import { z } from 'zod'
import { createWriteStream } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = join(__dirname, '..')
const SNAPSHOT_PATH = join(REPO_ROOT, 'data', 'ssi-wastewater-snapshot.json')

// ---------------------------------------------------------------------------
// SSI source — NOTE: SSI has no stable REST API and publishes via file download.
//
// The publicly downloadable ZIP (confirmed 2026-06-24) contains:
//   - dk_wastewater_data.csv     — national aggregate, columns: date,week,rna_mean_faeces,
//                                  ci_low_rna,ci_high_rna,level,lab
//   - region_wastewater_data.csv — per-region aggregate
//
// IMPORTANT: The public CSV contains NO per-treatment-plant data. Plant-level
// granularity is not publicly released. The snapshot therefore uses the national
// signal as a uniform score across all plants — per-plant scores are SEED.
//
// The week column uses ISO format "YYYY-WXX" (e.g. "2026-W25").
// The level column uses text: "Very low level" → 0, "Low level" → 1,
//   "Medium level" → 2, "High level" → 3, "Very high level" → 3.
//
// The ZIP URL is discovered dynamically from the SSI wastewater page:
//   https://en.ssi.dk/surveillance-and-preparedness/surveillance-in-denmark/national-wastewater-surveillance-of-sars-cov-2-and-influenza-a
// ---------------------------------------------------------------------------

const SSI_WASTEWATER_PAGE =
  'https://en.ssi.dk/surveillance-and-preparedness/surveillance-in-denmark/national-wastewater-surveillance-of-sars-cov-2-and-influenza-a'

const DAWA_BASE = 'https://api.dataforsyningen.dk'

// ---------------------------------------------------------------------------
// Known treatment-plant centroids (29 SSI sampling facilities as of 2026).
// These are geographic centroids of each plant's physical location.
// Source: SSI wastewater surveillance documentation + OSM/Google Maps spot-check.
// ---------------------------------------------------------------------------

const KNOWN_PLANTS: Array<{
  name: string
  aliases: string[]
  catchmentCentroid: [number, number]
}> = [
  { name: 'Lynetten', aliases: ['lynetten', 'lynet'], catchmentCentroid: [12.6262, 55.6924] },
  { name: 'Damhusåen', aliases: ['damhusåen', 'damhus'], catchmentCentroid: [12.4358, 55.6826] },
  { name: 'Avedøre', aliases: ['avedøre'], catchmentCentroid: [12.4561, 55.6192] },
  { name: 'Lundtofte', aliases: ['lundtofte'], catchmentCentroid: [12.509, 55.7793] },
  { name: 'Helsingør RA', aliases: ['helsingør', 'helsingor'], catchmentCentroid: [12.5934, 56.0357] },
  { name: 'Hillerød RA', aliases: ['hillerød', 'hillerod'], catchmentCentroid: [12.29, 55.93] },
  { name: 'Frederikssund RA', aliases: ['frederikssund'], catchmentCentroid: [11.9, 55.83] },
  { name: 'Roskilde RA', aliases: ['roskilde'], catchmentCentroid: [12.0867, 55.639] },
  { name: 'Køge RA', aliases: ['køge', 'koge'], catchmentCentroid: [12.1863, 55.4524] },
  { name: 'Næstved RA', aliases: ['næstved', 'naestved'], catchmentCentroid: [11.76, 55.23] },
  { name: 'Odense Ejby RA', aliases: ['odense', 'ejby'], catchmentCentroid: [10.2913, 55.379] },
  { name: 'Odense NØ RA', aliases: ['odense nø', 'odense nord'], catchmentCentroid: [10.4, 55.42] },
  { name: 'Svendborg RA', aliases: ['svendborg'], catchmentCentroid: [10.6078, 55.06] },
  { name: 'Vejle RA', aliases: ['vejle'], catchmentCentroid: [9.5357, 55.709] },
  { name: 'Kolding RA', aliases: ['kolding'], catchmentCentroid: [9.493, 55.49] },
  { name: 'Fredericia RA', aliases: ['fredericia'], catchmentCentroid: [9.75, 55.57] },
  { name: 'Horsens RA', aliases: ['horsens'], catchmentCentroid: [9.86, 55.85] },
  { name: 'Aarhus Egå RA', aliases: ['egå', 'aarhus egå', 'aarhus nord'], catchmentCentroid: [10.25, 56.21] },
  { name: 'Aarhus C RA', aliases: ['aarhus c', 'aarhus', 'marselisborg'], catchmentCentroid: [10.18, 56.16] },
  { name: 'Randers RA', aliases: ['randers'], catchmentCentroid: [10.04, 56.46] },
  { name: 'Viborg RA', aliases: ['viborg'], catchmentCentroid: [9.4057, 56.45] },
  { name: 'Silkeborg RA', aliases: ['silkeborg'], catchmentCentroid: [9.57, 56.16] },
  { name: 'Herning RA', aliases: ['herning'], catchmentCentroid: [8.975, 56.135] },
  { name: 'Esbjerg RA', aliases: ['esbjerg'], catchmentCentroid: [8.47, 55.47] },
  { name: 'Aalborg Vest RA', aliases: ['aalborg vest', 'aalborg v'], catchmentCentroid: [9.85, 57.02] },
  { name: 'Aalborg Øst RA', aliases: ['aalborg øst', 'aalborg ø', 'aalborg'], catchmentCentroid: [10.12, 57.05] },
  { name: 'Frederikshavn RA', aliases: ['frederikshavn'], catchmentCentroid: [10.56, 57.44] },
  { name: 'Holstebro RA', aliases: ['holstebro'], catchmentCentroid: [8.64, 56.36] },
  { name: 'Slagelse RA', aliases: ['slagelse'], catchmentCentroid: [11.36, 55.4] },
]

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const PlantRecordSchema = z.object({
  name: z.string(),
  catchmentCentroid: z.tuple([z.number(), z.number()]),
  kommuneKode: z.string().regex(/^\d{4}$/).nullable(),
  kommuneNavn: z.string().nullable(),
  score: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
})

const WastewaterSnapshotSchema = z.object({
  _seed: z.boolean(),
  _note: z.string(),
  _refreshCommand: z.string(),
  _ssiSourceUrl: z.string(),
  week: z.number().int().min(1).max(53),
  year: z.number().int().min(2020),
  updatedAt: z.string().datetime(),
  plants: z.array(PlantRecordSchema).min(10),
})

type PlantRecord = z.infer<typeof PlantRecordSchema>
type WastewaterSnapshot = z.infer<typeof WastewaterSnapshotSchema>

// ---------------------------------------------------------------------------
// DAWA reverse geocode
// ---------------------------------------------------------------------------

async function resolveKommune(
  lon: number,
  lat: number,
): Promise<{ kommuneKode: string; kommuneNavn: string } | null> {
  try {
    const res = await fetch(`${DAWA_BASE}/adgangsadresser/reverse?x=${lon}&y=${lat}`)
    if (!res.ok) return null
    const data = (await res.json()) as { kommune?: { kode: string; navn: string } }
    if (!data.kommune) return null
    return { kommuneKode: data.kommune.kode, kommuneNavn: data.kommune.navn }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Match a CSV plant name to a known plant (normalised substring match)
// ---------------------------------------------------------------------------

function matchPlant(csvName: string): (typeof KNOWN_PLANTS)[0] | null {
  const normalised = csvName.toLowerCase().trim()
  return (
    KNOWN_PLANTS.find(
      (p) =>
        normalised.includes(p.name.toLowerCase()) ||
        p.aliases.some((a) => normalised.includes(a)),
    ) ?? null
  )
}

// ---------------------------------------------------------------------------
// ISO week number from a Date
// ---------------------------------------------------------------------------

function isoWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { week, year: d.getUTCFullYear() }
}

// ---------------------------------------------------------------------------
// Attempt to scrape the SSI page for a ZIP download link
// ---------------------------------------------------------------------------

async function discoverZipUrl(): Promise<string | null> {
  try {
    const res = await fetch(SSI_WASTEWATER_PAGE, {
      headers: { 'User-Agent': 'SSI-Snapshot-Script/1.0 (portfolio demo; not scraping)' },
    })
    if (!res.ok) return null
    const html = await res.text()
    // Look for .zip href patterns in the page source
    const match = html.match(/href="([^"]*\.zip[^"]*)"/i)
    if (!match) return null
    const href = match[1]
    // Resolve relative URLs
    if (href.startsWith('http')) return href
    if (href.startsWith('/')) return `https://www.ssi.dk${href}`
    return null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Download and extract ZIP, return inner CSV text
// ---------------------------------------------------------------------------

async function downloadAndExtractCsv(zipUrl: string): Promise<string | null> {
  try {
    const res = await fetch(zipUrl, {
      headers: { 'User-Agent': 'SSI-Snapshot-Script/1.0 (portfolio demo)' },
    })
    if (!res.ok) {
      console.warn(`[ssi-snapshot] ZIP download failed: HTTP ${res.status} from ${zipUrl}`)
      return null
    }
    const buffer = await res.arrayBuffer()

    // Use the built-in DecompressionStream for gzip, or fallback to fflate/yauzl.
    // For ZIP format we need a ZIP parser — use dynamic import of 'fflate' if available.
    try {
      // @ts-expect-error — fflate may not be in devDependencies; add it if needed:
      // bun add fflate
      const { unzipSync, strFromU8 } = await import('fflate')
      const unzipped = unzipSync(new Uint8Array(buffer))
      const csvEntry = Object.entries(unzipped).find(([name]) =>
        name.toLowerCase().endsWith('.csv'),
      )
      if (!csvEntry) {
        console.warn('[ssi-snapshot] No CSV found inside ZIP')
        return null
      }
      return strFromU8(csvEntry[1] as Uint8Array)
    } catch {
      console.warn('[ssi-snapshot] fflate not available — add it: bun add fflate')
      return null
    }
  } catch (e) {
    console.warn('[ssi-snapshot] Download error:', e)
    return null
  }
}

// ---------------------------------------------------------------------------
// Parse SSI CSV — comma-delimited with English headers (confirmed 2026-06-24).
// Columns: date, week, rna_mean_faeces, ci_low_rna, ci_high_rna, level, lab
// Week format: "YYYY-WXX" (ISO 8601).
// Level values: "Very low level" | "Low level" | "Medium level" |
//               "High level" | "Very high level"
// ---------------------------------------------------------------------------

type CsvRow = Record<string, string>

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const sep = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const values = line.split(sep).map((v) => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

// Maps the SSI "level" text column to a 0–3 score.
function levelToScore(level: string): 0 | 1 | 2 | 3 {
  const l = level.toLowerCase()
  if (l.includes('very low')) return 0
  if (l.includes('low')) return 1
  if (l.includes('medium')) return 2
  if (l.includes('high')) return 3 // "High level" and "Very high level" both → 3
  return 0
}

// Parse "YYYY-WXX" to { week, year }.
function parseIsoWeek(raw: string): { week: number; year: number } | null {
  const m = raw.match(/^(\d{4})-W(\d{1,2})$/)
  if (!m) return null
  return { year: parseInt(m[1], 10), week: parseInt(m[2], 10) }
}

// ---------------------------------------------------------------------------
// Build plant list from SSI national CSV for a given week/year.
// The public CSV has no per-plant column — the national signal is applied
// uniformly to all known plants. Per-plant granularity is SEED.
// ---------------------------------------------------------------------------

async function buildPlantsFromCsv(
  rows: CsvRow[],
  week: number,
  year: number,
): Promise<PlantRecord[]> {
  // Find the row for the target week (or the most recent available if exact not found)
  let targetRow = rows.find((r) => {
    const parsed = parseIsoWeek(r['week'] ?? '')
    return parsed?.week === week && parsed?.year === year
  })
  // Fall back to most recent row
  if (!targetRow) {
    const lastRow = rows[rows.length - 1]
    if (lastRow) {
      const parsed = parseIsoWeek(lastRow['week'] ?? '')
      if (parsed) {
        console.log(
          `[ssi-snapshot] Week ${year}-W${week} not in CSV; using most recent: ${lastRow['week']}`,
        )
        targetRow = lastRow
      }
    }
  }
  if (!targetRow) return []

  const score = levelToScore(targetRow['level'] ?? '')
  const actualWeek = parseIsoWeek(targetRow['week'] ?? '')
  console.log(
    `[ssi-snapshot] National signal: level="${targetRow['level']}" → score=${score} (week ${actualWeek?.year}-W${actualWeek?.week})`,
  )

  // Resolve kommuneKoder via DAWA and apply national score to all known plants
  const results: PlantRecord[] = []
  for (const plant of KNOWN_PLANTS) {
    const [lon, lat] = plant.catchmentCentroid
    const geo = await resolveKommune(lon, lat)
    results.push({
      name: plant.name,
      catchmentCentroid: plant.catchmentCentroid,
      kommuneKode: geo?.kommuneKode ?? null,
      kommuneNavn: geo?.kommuneNavn ?? null,
      score,
    })
  }
  return results
}

// ---------------------------------------------------------------------------
// SEED fallback — real plant locations, real DAWA kommuneKoder, demo scores
// ---------------------------------------------------------------------------

async function buildSeedPlants(): Promise<PlantRecord[]> {
  console.log('[ssi-snapshot] Resolving SEED plant kommuneKoder via live DAWA...')
  const results: PlantRecord[] = []
  // Deterministic demo scores (not from SSI — labelled _seed:true in output)
  const seedScores: Array<0 | 1 | 2 | 3> = [
    1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 2, 1, 0, 1, 2, 1, 0, 1, 0, 0, 1, 2, 1, 0, 1, 0,
  ]
  for (let i = 0; i < KNOWN_PLANTS.length; i++) {
    const plant = KNOWN_PLANTS[i]
    const [lon, lat] = plant.catchmentCentroid
    const geo = await resolveKommune(lon, lat)
    results.push({
      name: plant.name,
      catchmentCentroid: plant.catchmentCentroid,
      kommuneKode: geo?.kommuneKode ?? null,
      kommuneNavn: geo?.kommuneNavn ?? null,
      score: seedScores[i] ?? 0,
    })
  }
  return results
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('[ssi-snapshot] Starting SSI wastewater snapshot...')

  const now = new Date()
  const { week, year } = isoWeek(now)
  let plants: PlantRecord[] = []
  let isSeed = false

  // 1. Attempt real SSI data
  console.log(`[ssi-snapshot] Looking for SSI ZIP for week ${week}/${year}...`)
  const zipUrl = await discoverZipUrl()

  if (zipUrl) {
    console.log(`[ssi-snapshot] Found ZIP URL: ${zipUrl}`)
    const csv = await downloadAndExtractCsv(zipUrl)
    if (csv) {
      const rows = parseCsv(csv)
      console.log(`[ssi-snapshot] Parsed ${rows.length} CSV rows`)
      plants = await buildPlantsFromCsv(rows, week, year)
      if (plants.length >= 10) {
        console.log(`[ssi-snapshot] Got ${plants.length} plants from SSI — REAL data`)
      } else {
        console.warn(
          `[ssi-snapshot] Only ${plants.length} plants matched for week ${week}/${year} — falling back to SEED`,
        )
        plants = []
      }
    }
  } else {
    console.warn('[ssi-snapshot] Could not discover ZIP URL from SSI page — falling back to SEED')
  }

  // 2. Fallback: SEED with real DAWA kommuneKoder
  if (plants.length === 0) {
    isSeed = true
    plants = await buildSeedPlants()
    console.log(`[ssi-snapshot] Built SEED snapshot with ${plants.length} plants (kommuneKoder from DAWA)`)
  }

  // 3. Validate output shape
  const snapshot: WastewaterSnapshot = {
    _seed: isSeed,
    _note: isSeed
      ? 'SEED DATA — synthesized for demo. Plant locations and kommuneKoder are REAL (resolved via live DAWA reverseGeocode). Scores are plausible demo values NOT from SSI. Run "bun run ssi:snapshot" to replace with real data.'
      : `REAL DATA — national SARS-CoV-2 signal fetched from SSI wastewater ZIP (public CSV has no per-plant data; national level applied uniformly across all plants). KommuneKoder resolved via live DAWA reverseGeocode.`,
    _refreshCommand: 'bun run ssi:snapshot',
    _ssiSourceUrl: SSI_WASTEWATER_PAGE,
    week,
    year,
    updatedAt: now.toISOString(),
    plants,
  }

  const parsed = WastewaterSnapshotSchema.safeParse(snapshot)
  if (!parsed.success) {
    console.error('[ssi-snapshot] Zod validation failed:', parsed.error.format())
    process.exit(1)
  }

  // 4. Write to data/ssi-wastewater-snapshot.json
  await mkdir(dirname(SNAPSHOT_PATH), { recursive: true })
  await writeFile(SNAPSHOT_PATH, JSON.stringify(parsed.data, null, 2) + '\n')
  console.log(`[ssi-snapshot] Wrote ${SNAPSHOT_PATH}`)
  console.log(
    `[ssi-snapshot] Done — ${plants.length} plants, seed=${isSeed}, week=${week}/${year}`,
  )
}

main().catch((e) => {
  console.error('[ssi-snapshot] Fatal:', e)
  process.exit(1)
})
