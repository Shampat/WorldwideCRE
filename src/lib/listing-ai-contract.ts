export type AIFieldConfidence =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'

export type AIFieldSource =
  | 'USER_TEXT'
  | 'DOCUMENT'
  | 'AI_INFERENCE'

export type AIExtractedField<T> = {
  value: T | null
  confidence: AIFieldConfidence
  source: AIFieldSource
  evidence: string | null
  requiresConfirmation: boolean
}

export type AIListingExtraction = {
  transactionType: AIExtractedField<
    'SALE' | 'LEASE' | 'SUBLEASE'
  >

  propertyCategory: AIExtractedField<string>
  propertyType: AIExtractedField<string>

  address: AIExtractedField<string>
  city: AIExtractedField<string>
  region: AIExtractedField<string>
  postalCode: AIExtractedField<string>

  buildingAreaSqFt: AIExtractedField<number>
  availableAreaSqFt: AIExtractedField<number>
  lotAreaSqFt: AIExtractedField<number>

  askingPrice: AIExtractedField<number>

  leaseRate: AIExtractedField<number>
  leaseRateBasis: AIExtractedField<
    'ANNUAL' | 'MONTHLY' | 'SQFT_YEAR'
  >

  title: AIExtractedField<string>
  description: AIExtractedField<string>

  features: AIExtractedField<string[]>
  availability: AIExtractedField<string>

  extractionWarnings: string[]
}

export type AIListingDraftProposal = {
  version: 1

  originalInput: string

  extractedAt: string

  extraction: AIListingExtraction

  userConfirmedFields: string[]
}

export const AI_LISTING_RULES = {
  unknownValuesRemainNull: true,

  userReviewRequired: true,

  automaticPublishingAllowed: false,

  inferredFactsRequireConfirmation: true,

  preserveOriginalInput: true,

  evidenceRequiredForDocumentFacts: true,
} as const
