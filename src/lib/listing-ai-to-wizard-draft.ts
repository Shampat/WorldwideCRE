import type {
  AIListingDraftProposal,
} from './listing-ai-contract'

type WizardDraft = Record<string, unknown>

function textValue(value: unknown) {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  return String(value)
}

export function mapAIProposalToWizardDraft(
  proposal: AIListingDraftProposal,
  existingDraft: WizardDraft = {}
): WizardDraft {
  const extraction = proposal.extraction

  const nextDraft: WizardDraft = {
    ...existingDraft,

    aiAssisted: true,
    aiOriginalInput: proposal.originalInput,
    aiExtractedAt: proposal.extractedAt,
  }

  if (extraction.transactionType.value) {
    nextDraft.transactionType =
      extraction.transactionType.value
  }

  if (extraction.propertyCategory.value) {
    nextDraft.categoryName =
      extraction.propertyCategory.value
  }

  if (extraction.propertyType.value) {
    nextDraft.propertyTypeName =
      extraction.propertyType.value
  }

  if (extraction.city.value) {
    nextDraft.city =
      extraction.city.value
  }

  if (extraction.region.value) {
    nextDraft.province =
      extraction.region.value
  }

  if (extraction.address.value) {
    nextDraft.address =
      extraction.address.value
  }

  if (extraction.availableAreaSqFt.value !== null) {
    nextDraft.area = textValue(
      extraction.availableAreaSqFt.value
    )
  }

  if (extraction.title.value) {
    nextDraft.title =
      extraction.title.value
  }

  if (extraction.description.value) {
    nextDraft.description =
      extraction.description.value
  }

  if (
    extraction.transactionType.value === 'SALE' &&
    extraction.askingPrice.value !== null
  ) {
    nextDraft.salePrice = textValue(
      extraction.askingPrice.value
    )
  }

  if (
    (
      extraction.transactionType.value === 'LEASE' ||
      extraction.transactionType.value === 'SUBLEASE'
    ) &&
    extraction.leaseRate.value !== null
  ) {
    nextDraft.leaseRate = textValue(
      extraction.leaseRate.value
    )

    /*
     * Preserve the AI's actual rate basis.
     *
     * Do NOT silently map SQFT_YEAR to ANNUAL.
     * $28/sq-ft/year is not the same thing as
     * $28/year.
     */
    nextDraft.leaseRateBasis =
      extraction.leaseRateBasis.value
  }

  nextDraft.currency =
    existingDraft.currency ?? 'CAD'

  return nextDraft
}
