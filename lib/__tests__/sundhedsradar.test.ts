import { describe, it, expect } from 'vitest'
import {
  computeVulnerabilityIndex,
  normalizePrescriptions,
  mapWastewaterToNorm,
  computeWeatherFactor,
  assignTier,
  computeComposite,
  computeKommuneSignal,
  type RawSignalInputs,
} from '../sundhedsradar'
import { KommuneSignalSchema } from '../sundhedsradar.types'
import type { Folk1aSlice, Medi1Slice } from '../sundhedsradar.types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const youngUrbanFolk1a: Folk1aSlice = {
  kommuneKode: '0101',
  totalPopulation: 50000,
  age0_2: 200,
  age65plus: 300,
}

const elderlyRuralFolk1a: Folk1aSlice = {
  kommuneKode: '0751',
  totalPopulation: 10000,
  age0_2: 100,
  age65plus: 4500,
}

const lowMedi1: Medi1Slice = { kommuneKode: '0101', scriptsPerHundred: 5 }
const highMedi1: Medi1Slice = { kommuneKode: '0751', scriptsPerHundred: 30 }

const baseLowRiskInputs: RawSignalInputs = {
  kommuneKode: '0101',
  kommuneNavn: 'København',
  week: 25,
  year: 2025,
  folk1aSlice: youngUrbanFolk1a,
  medi1Slice: lowMedi1,
  wastewaterScore: 0,
  seasonalBaseline: 0.1,
  dmiMeanTempC: 20,
}

const baseHighRiskInputs: RawSignalInputs = {
  kommuneKode: '0751',
  kommuneNavn: 'Fredericia',
  week: 5,
  year: 2025,
  folk1aSlice: elderlyRuralFolk1a,
  medi1Slice: highMedi1,
  wastewaterScore: 3,
  seasonalBaseline: 0.9,
  dmiMeanTempC: -5,
}

// ---------------------------------------------------------------------------
// Group 1: computeVulnerabilityIndex
// ---------------------------------------------------------------------------

describe('computeVulnerabilityIndex', () => {
  it('returns 0.3 for a mixed population', () => {
    const result = computeVulnerabilityIndex({
      kommuneKode: '0101',
      totalPopulation: 10000,
      age0_2: 1000,
      age65plus: 2000,
    })
    expect(result).toBeCloseTo(0.3, 3)
  })

  it('returns 0 when no vulnerable population', () => {
    const result = computeVulnerabilityIndex({
      kommuneKode: '0101',
      totalPopulation: 5000,
      age0_2: 0,
      age65plus: 0,
    })
    expect(result).toBe(0)
  })

  it('clamps to 1.0 when vulnerable share exceeds total', () => {
    const result = computeVulnerabilityIndex({
      kommuneKode: '0101',
      totalPopulation: 10000,
      age0_2: 5000,
      age65plus: 5000,
    })
    expect(result).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// Group 2: normalizePrescriptions
// ---------------------------------------------------------------------------

describe('normalizePrescriptions', () => {
  it('returns 0.5 for 12.5 scripts/100', () => {
    expect(normalizePrescriptions(12.5)).toBeCloseTo(0.5, 3)
  })

  it('returns 0 for 0 scripts/100', () => {
    expect(normalizePrescriptions(0)).toBe(0)
  })

  it('clamps to 1.0 for 50 scripts/100', () => {
    expect(normalizePrescriptions(50)).toBe(1.0)
  })

  it('returns exactly 1.0 at the 25 reference boundary', () => {
    expect(normalizePrescriptions(25)).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// Group 3: mapWastewaterToNorm
// ---------------------------------------------------------------------------

describe('mapWastewaterToNorm', () => {
  it('maps score 0 to 0', () => {
    expect(mapWastewaterToNorm(0)).toBe(0)
  })

  it('maps score 1 to ~0.333', () => {
    expect(mapWastewaterToNorm(1)).toBeCloseTo(1 / 3, 3)
  })

  it('maps score 2 to ~0.667', () => {
    expect(mapWastewaterToNorm(2)).toBeCloseTo(2 / 3, 3)
  })

  it('maps score 3 to 1.0', () => {
    expect(mapWastewaterToNorm(3)).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// Group 4: computeWeatherFactor
// ---------------------------------------------------------------------------

describe('computeWeatherFactor', () => {
  it('returns 0.5 neutral default when DMI key is absent (null)', () => {
    expect(computeWeatherFactor(null)).toBe(0.5)
  })

  it('returns 0.0 at the 5°C threshold', () => {
    expect(computeWeatherFactor(5.0)).toBe(0.0)
  })

  it('returns 1.0 at -10°C (cold max)', () => {
    expect(computeWeatherFactor(-10.0)).toBe(1.0)
  })

  it('returns 0.2 at 2°C', () => {
    expect(computeWeatherFactor(2.0)).toBeCloseTo(0.2, 3)
  })

  it('clamps to 1.0 at extreme cold (-100°C)', () => {
    expect(computeWeatherFactor(-100)).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// Group 5: assignTier
// ---------------------------------------------------------------------------

describe('assignTier', () => {
  it('assigns "Rolig" for score 0.0', () => {
    expect(assignTier(0.0)).toBe('Rolig')
  })

  it('assigns "Rolig" for score 0.32 (below 0.33 threshold)', () => {
    expect(assignTier(0.32)).toBe('Rolig')
  })

  it('assigns "Forhøjet" at the 0.33 threshold', () => {
    expect(assignTier(0.33)).toBe('Forhøjet')
  })

  it('assigns "Forhøjet" for score 0.50', () => {
    expect(assignTier(0.50)).toBe('Forhøjet')
  })

  it('assigns "Forhøjet" for score 0.66 (below 0.67 threshold)', () => {
    expect(assignTier(0.66)).toBe('Forhøjet')
  })

  it('assigns "Høj" at the 0.67 threshold', () => {
    expect(assignTier(0.67)).toBe('Høj')
  })

  it('assigns "Høj" for score 1.0', () => {
    expect(assignTier(1.0)).toBe('Høj')
  })
})

// ---------------------------------------------------------------------------
// Group 6: computeComposite
// ---------------------------------------------------------------------------

describe('computeComposite', () => {
  it('returns 0.0 when all components are zero', () => {
    expect(
      computeComposite({
        wastewaterNorm: 0,
        vulnerabilityIndex: 0,
        prescriptionNorm: 0,
        seasonalBaseline: 0,
        weatherFactor: 0,
      }),
    ).toBe(0.0)
  })

  it('returns 1.0 when all components are one', () => {
    expect(
      computeComposite({
        wastewaterNorm: 1,
        vulnerabilityIndex: 1,
        prescriptionNorm: 1,
        seasonalBaseline: 1,
        weatherFactor: 1,
      }),
    ).toBeCloseTo(1.0, 3)
  })

  it('applies wastewater weight 0.35 correctly', () => {
    expect(
      computeComposite({
        wastewaterNorm: 1,
        vulnerabilityIndex: 0,
        prescriptionNorm: 0,
        seasonalBaseline: 0,
        weatherFactor: 0,
      }),
    ).toBeCloseTo(0.35, 3)
  })

  it('applies vulnerability weight 0.25 correctly', () => {
    expect(
      computeComposite({
        wastewaterNorm: 0,
        vulnerabilityIndex: 1,
        prescriptionNorm: 0,
        seasonalBaseline: 0,
        weatherFactor: 0,
      }),
    ).toBeCloseTo(0.25, 3)
  })
})

// ---------------------------------------------------------------------------
// Group 7: computeKommuneSignal (integration)
// ---------------------------------------------------------------------------

describe('computeKommuneSignal', () => {
  it('low-risk scenario yields tier "Rolig" and compositeScore < 0.33', () => {
    const signal = computeKommuneSignal(baseLowRiskInputs)
    expect(signal.tier).toBe('Rolig')
    expect(signal.compositeScore).toBeLessThan(0.33)
  })

  it('high-risk scenario yields tier "Høj" and compositeScore >= 0.67', () => {
    const signal = computeKommuneSignal(baseHighRiskInputs)
    expect(signal.tier).toBe('Høj')
    expect(signal.compositeScore).toBeGreaterThanOrEqual(0.67)
  })

  it('null DMI temp excludes "DMI" from sourcesUsed and sets weatherFactor 0.5', () => {
    const signal = computeKommuneSignal({ ...baseLowRiskInputs, dmiMeanTempC: null })
    expect(signal.sourcesUsed).not.toContain('DMI')
    expect(signal.components.weatherFactor).toBe(0.5)
  })

  it('wastewater score 0 excludes "SSI" from sourcesUsed', () => {
    const signal = computeKommuneSignal({ ...baseHighRiskInputs, wastewaterScore: 0 })
    expect(signal.sourcesUsed).not.toContain('SSI')
  })

  it('output validates against KommuneSignalSchema', () => {
    const signal = computeKommuneSignal(baseLowRiskInputs)
    const result = KommuneSignalSchema.safeParse(signal)
    expect(result.success).toBe(true)
  })
})
