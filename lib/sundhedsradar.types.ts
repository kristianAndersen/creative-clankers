import { z } from 'zod'

export const SignalTierEnum = z.enum(['Rolig', 'Forhøjet', 'Høj'])
export type SignalTier = z.infer<typeof SignalTierEnum>

export const Folk1aSliceSchema = z.object({
  kommuneKode: z.string(),
  totalPopulation: z.number().int().positive(),
  age0_2: z.number().int().min(0),
  age65plus: z.number().int().min(0),
})
export type Folk1aSlice = z.infer<typeof Folk1aSliceSchema>

export const Medi1SliceSchema = z.object({
  kommuneKode: z.string(),
  scriptsPerHundred: z.number().min(0),
})
export type Medi1Slice = z.infer<typeof Medi1SliceSchema>

export const SignalComponentsSchema = z.object({
  wastewaterNorm: z.number().min(0).max(1),
  vulnerabilityIndex: z.number().min(0).max(1),
  prescriptionNorm: z.number().min(0).max(1),
  seasonalBaseline: z.number().min(0).max(1),
  weatherFactor: z.number().min(0).max(1),
})
export type SignalComponents = z.infer<typeof SignalComponentsSchema>

export const KommuneSignalSchema = z.object({
  kommuneKode: z.string().length(4),
  kommuneNavn: z.string().min(1),
  week: z.number().int().min(1).max(53),
  year: z.number().int().min(2019),
  components: SignalComponentsSchema,
  compositeScore: z.number().min(0).max(1),
  tier: SignalTierEnum,
  sourcesUsed: z.array(z.enum(['SSI', 'DST', 'DMI', 'DAWA'])).min(1),
  folk1a: Folk1aSliceSchema,
  medi1: Medi1SliceSchema,
  wastewaterScore: z.number().min(0).max(3),
  dmiMeanTempC: z.number().nullable(),
})
export type KommuneSignal = z.infer<typeof KommuneSignalSchema>

export const PlannerEventSchema = z.object({
  rawText: z.string().min(5).max(500),
  parsedDate: z.string().nullable(),
  parsedKommuneKode: z.string().nullable(),
  householdFlags: z.object({
    hasInfant: z.boolean(),
    hasElderly: z.boolean(),
  }),
})
export type PlannerEvent = z.infer<typeof PlannerEventSchema>

export const ArchiveEntrySchema = z.object({
  week: z.number().int().min(1).max(53),
  year: z.number().int().min(2019).max(2026),
  pathogen: z.enum(['covid19', 'influenza', 'rsv']),
  nationalTier: SignalTierEnum,
  source: z.literal('SSI'),
})
export type ArchiveEntry = z.infer<typeof ArchiveEntrySchema>
