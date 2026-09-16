import type {
  AIExtractedField,
  AIListingExtraction,
} from './listing-ai-contract'

function field<T>(
  value: T | null,
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW',
  evidence: string | null = null,
  requiresConfirmation = true
): AIExtractedField<T> {
  return {
    value,
    confidence,
    source: 'USER_TEXT',
    evidence,
    requiresConfirmation,
  }
}

export function extractDevelopmentListing(
  input: string
): AIListingExtraction {
  const text = input.trim()
  const lower = text.toLowerCase()

  let transactionType:
    | 'SALE'
    | 'LEASE'
    | 'SUBLEASE'
    | null = null

  if (
    lower.includes('sublease') ||
    lower.includes('sublet')
  ) {
    transactionType = 'SUBLEASE'
  } else if (
    lower.includes('for lease') ||
    lower.includes('for rent')
  ) {
    transactionType = 'LEASE'
  } else if (
    lower.includes('for sale')
  ) {
    transactionType = 'SALE'
  }

  let propertyType: string | null = null

  const propertyTypes = [
    'office',
    'industrial',
    'retail',
    'restaurant',
    'warehouse',
    'land',
  ]

  for (const type of propertyTypes) {
    if (lower.includes(type)) {
      propertyType =
        type.charAt(0).toUpperCase() + type.slice(1)
      break
    }
  }

  const areaMatch = text.match(
    /([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s*ft|sqft|square feet)/i
  )

  const availableAreaSqFt = areaMatch
    ? Number(areaMatch[1].replace(/,/g, ''))
    : null

  const rateMatch = text.match(
    /\$([\d,]+(?:\.\d+)?)\s*(?:per\s*)?(?:sq\.?\s*ft|sqft|sf)(?:\s*per\s*year|\/\s*year|\/\s*yr)?/i
  )

  const leaseRate = rateMatch
    ? Number(rateMatch[1].replace(/,/g, ''))
    : null

  const warnings: string[] = []

  if (!transactionType) {
    warnings.push(
      'Transaction type was not clearly provided.'
    )
  }

  if (!propertyType) {
    warnings.push(
      'Property type was not clearly provided.'
    )
  }

  if (!availableAreaSqFt) {
    warnings.push(
      'Available area was not clearly provided.'
    )
  }

  return {
    transactionType: field(
      transactionType,
      transactionType ? 'HIGH' : 'LOW',
      transactionType ? text : null,
      false
    ),

    propertyCategory: field<string>(null),

    propertyType: field(
      propertyType,
      propertyType ? 'HIGH' : 'LOW',
      propertyType ? text : null,
      false
    ),

    address: field<string>(null),
    city: field<string>(null),
    region: field<string>(null),
    postalCode: field<string>(null),

    buildingAreaSqFt: field<number>(null),

    availableAreaSqFt: field(
      availableAreaSqFt,
      availableAreaSqFt ? 'HIGH' : 'LOW',
      availableAreaSqFt ? areaMatch?.[0] ?? null : null,
      false
    ),

    lotAreaSqFt: field<number>(null),

    askingPrice: field<number>(null),

    leaseRate: field(
      leaseRate,
      leaseRate ? 'HIGH' : 'LOW',
      leaseRate ? rateMatch?.[0] ?? null : null,
      false
    ),

    leaseRateBasis: field(
      leaseRate ? 'SQFT_YEAR' : null,
      leaseRate ? 'MEDIUM' : 'LOW',
      leaseRate ? rateMatch?.[0] ?? null : null,
      Boolean(leaseRate)
    ),

    title: field<string>(null),

    description: field(
      text || null,
      text ? 'HIGH' : 'LOW',
      text || null,
      false
    ),

    features: field<string[]>(null),

    availability: field(
      lower.includes('available immediately')
        ? 'Available immediately'
        : null,
      lower.includes('available immediately')
        ? 'HIGH'
        : 'LOW',
      lower.includes('available immediately')
        ? 'available immediately'
        : null,
      true
    ),

    extractionWarnings: warnings,
  }
}
