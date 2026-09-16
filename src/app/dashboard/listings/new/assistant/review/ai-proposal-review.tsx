'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type {
  AIListingDraftProposal,
  AIExtractedField,
} from '@/lib/listing-ai-contract'
import { mapAIProposalToWizardDraft } from '@/lib/listing-ai-to-wizard-draft'

type DisplayField = {
  key: string
  label: string
  field: AIExtractedField<unknown>
  formattedValue?: string
}

function stateForField(
  field: AIExtractedField<unknown>
) {
  if (field.value === null) {
    return 'missing'
  }

  if (field.requiresConfirmation) {
    return 'confirm'
  }

  return 'extracted'
}

function stateLabel(state: string) {
  if (state === 'extracted') return 'Extracted'
  if (state === 'confirm') return 'Confirm'
  return 'Not provided'
}

function stateClasses(state: string) {
  if (state === 'extracted') {
    return 'border-teal-200 bg-teal-50 text-teal-800'
  }

  if (state === 'confirm') {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }

  return 'border-slate-200 bg-slate-50 text-slate-500'
}

function formatTransaction(value: unknown) {
  if (value === 'SALE') return 'For Sale'
  if (value === 'LEASE') return 'For Lease'
  if (value === 'SUBLEASE') return 'For Sublease'
  return 'Not provided'
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) {
    return 'Not provided'
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? value.join(', ')
      : 'Not provided'
  }

  return String(value)
}

export default function AIProposalReview() {
  const [proposal, setProposal] =
    useState<AIListingDraftProposal | null>(null)

  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(
      'worldwidecre_ai_listing_proposal'
    )

    if (stored) {
      try {
        setProposal(
          JSON.parse(stored) as AIListingDraftProposal
        )
      } catch {
        setProposal(null)
      }
    }

    setLoaded(true)
  }, [])

  if (!loaded) {
    return (
      <div className="px-8 py-10 text-sm text-slate-500">
        Loading draft…
      </div>
    )
  }

  function useTheseDetails() {
    if (!proposal) {
      return
    }

    let existingDraft: Record<string, unknown> = {}

    const storedDraft = localStorage.getItem(
      'worldwidecre_listing_draft'
    )

    if (storedDraft) {
      try {
        existingDraft = JSON.parse(storedDraft)
      } catch {
        existingDraft = {}
      }
    }

    const nextDraft = mapAIProposalToWizardDraft(
      proposal,
      existingDraft
    )

    localStorage.setItem(
      'worldwidecre_listing_draft',
      JSON.stringify(nextDraft)
    )

    window.location.href =
      '/dashboard/listings/new'
  }

  if (!proposal) {
    return (
      <div className="px-8 py-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-semibold text-amber-950">
            No AI draft was found
          </p>

          <p className="mt-2 text-sm text-amber-800">
            Return to the AI Listing Assistant and describe
            the property first.
          </p>

          <Link
            href="/dashboard/listings/new/assistant"
            className="mt-4 inline-flex text-sm font-semibold text-amber-950 hover:underline"
          >
            ← Return to AI Listing Assistant
          </Link>
        </div>
      </div>
    )
  }

  const extraction = proposal.extraction

  const fields: DisplayField[] = [
    {
      key: 'transactionType',
      label: 'Transaction',
      field: extraction.transactionType,
      formattedValue: formatTransaction(
        extraction.transactionType.value
      ),
    },
    {
      key: 'propertyType',
      label: 'Property type',
      field: extraction.propertyType,
    },
    {
      key: 'city',
      label: 'City',
      field: extraction.city,
    },
    {
      key: 'region',
      label: 'Province / Region',
      field: extraction.region,
    },
    {
      key: 'availableAreaSqFt',
      label: 'Available area',
      field: extraction.availableAreaSqFt,
      formattedValue:
        extraction.availableAreaSqFt.value !== null
          ? `${Number(
              extraction.availableAreaSqFt.value
            ).toLocaleString('en-CA')} sq ft`
          : 'Not provided',
    },
    {
      key: 'leaseRate',
      label: 'Lease rate',
      field: extraction.leaseRate,
      formattedValue:
        extraction.leaseRate.value !== null
          ? `$${extraction.leaseRate.value} / sq ft / year`
          : 'Not provided',
    },
    {
      key: 'address',
      label: 'Street address',
      field: extraction.address,
    },
    {
      key: 'availability',
      label: 'Availability',
      field: extraction.availability,
    },
  ]

  return (
    <div className="px-8 py-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((item) => {
          const state = stateForField(item.field)

          return (
            <div
              key={item.key}
              className="rounded-2xl border border-slate-200 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>

                  <p className="mt-2 font-semibold text-slate-950">
                    {item.formattedValue ??
                      formatValue(item.field.value)}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${stateClasses(
                    state
                  )}`}
                >
                  {stateLabel(state)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {extraction.extractionWarnings.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">
            Information still needed
          </p>

          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {extraction.extractionWarnings.map(
              (warning) => (
                <li key={warning}>• {warning}</li>
              )
            )}
          </ul>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-semibold text-amber-950">
          AI has not completed your listing
        </p>

        <p className="mt-1 text-sm leading-6 text-amber-800">
          These are proposed values only. You will continue
          through the normal WorldwideCRE listing steps to
          verify, correct and complete the information before
          submission.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard/listings/new/assistant"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Edit property description
        </Link>

        <button
          type="button"
          onClick={useTheseDetails}
          className="rounded-xl bg-teal-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Use These Details →
        </button>
      </div>
    </div>
  )
}
