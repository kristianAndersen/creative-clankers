// Deterministic health-signal engine. The LLM never does arithmetic — it calls
// computeKommuneSignal(), real code computes everything, the model only narrates.
// All exports are pure: no I/O, no side effects, no module-level state.

import type {
  Folk1aSlice,
  Medi1Slice,
  SignalComponents,
  SignalTier,
  KommuneSignal,
} from './sundhedsradar.types'
import { KommuneSignalSchema } from './sundhedsradar.types'

export type RawSignalInputs = {
  kommuneKode: string
  kommuneNavn: string
  week: number
  year: number
  folk1aSlice: Folk1aSlice
  medi1Slice: Medi1Slice
  wastewaterScore: 0 | 1 | 2 | 3
  seasonalBaseline: number
  dmiMeanTempC: number | null
}

export function computeVulnerabilityIndex(folk1a: Folk1aSlice): number {
  const vulnerable = folk1a.age0_2 + folk1a.age65plus
  return Math.min(vulnerable / folk1a.totalPopulation, 1)
}

export function normalizePrescriptions(scriptsPerHundred: number): number {
  return Math.min(scriptsPerHundred / 25, 1)
}

export function mapWastewaterToNorm(score: 0 | 1 | 2 | 3): number {
  return score / 3
}

// null when DMI key absent — engine uses 0.5 (neutral mid-range)
export function computeWeatherFactor(meanTempC: number | null): number {
  if (meanTempC === null) return 0.5
  return Math.min(Math.max(0, (5 - meanTempC) / 15), 1)
}

export function assignTier(compositeScore: number): SignalTier {
  if (compositeScore < 0.33) return 'Rolig'
  if (compositeScore < 0.67) return 'Forhøjet'
  return 'Høj'
}

export function computeComposite(components: SignalComponents): number {
  return (
    0.35 * components.wastewaterNorm +
    0.25 * components.vulnerabilityIndex +
    0.20 * components.prescriptionNorm +
    0.10 * components.seasonalBaseline +
    0.10 * components.weatherFactor
  )
}

export function computeKommuneSignal(inputs: RawSignalInputs): KommuneSignal {
  const vulnerabilityIndex = computeVulnerabilityIndex(inputs.folk1aSlice)
  const wastewaterNorm = mapWastewaterToNorm(inputs.wastewaterScore)
  const prescriptionNorm = normalizePrescriptions(inputs.medi1Slice.scriptsPerHundred)
  const weatherFactor = computeWeatherFactor(inputs.dmiMeanTempC)

  const components: SignalComponents = {
    wastewaterNorm,
    vulnerabilityIndex,
    prescriptionNorm,
    seasonalBaseline: inputs.seasonalBaseline,
    weatherFactor,
  }

  const compositeScore = computeComposite(components)
  const tier = assignTier(compositeScore)

  const sourcesUsed: Array<'SSI' | 'DST' | 'DMI' | 'DAWA'> = ['DST']
  if (inputs.wastewaterScore > 0) sourcesUsed.push('SSI')
  if (inputs.dmiMeanTempC !== null) sourcesUsed.push('DMI')

  return KommuneSignalSchema.parse({
    kommuneKode: inputs.kommuneKode,
    kommuneNavn: inputs.kommuneNavn,
    week: inputs.week,
    year: inputs.year,
    components,
    compositeScore,
    tier,
    sourcesUsed,
    folk1a: inputs.folk1aSlice,
    medi1: inputs.medi1Slice,
    wastewaterScore: inputs.wastewaterScore,
    dmiMeanTempC: inputs.dmiMeanTempC,
  })
}
