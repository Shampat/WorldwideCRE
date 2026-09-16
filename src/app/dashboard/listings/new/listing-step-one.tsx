'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { restoreLatestListingWizardDraft } from '@/lib/listing-draft'

type Category = {
  id: string
  name: string
}

type PropertyType = {
  id: string
  category_id: string
  name: string
}

export default function ListingStepOne({
  categories,
  propertyTypes,
}: {
  categories: Category[]
  propertyTypes: PropertyType[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const resumeRequested = searchParams.get('resume') === '1'

  const [transactionType, setTransactionType] = useState('SALE')
  const [categoryId, setCategoryId] = useState('')
  const [propertyTypeId, setPropertyTypeId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDraft() {
      let draft: Record<string, unknown> | null = null
      let restoredStep: number | null = null

      if (resumeRequested) {
        try {
          const restored =
            await restoreLatestListingWizardDraft()

          if (restored?.draftData) {
            draft = restored.draftData
            restoredStep = restored.currentStep
          }
        } catch (error) {
          console.error(
            'Unable to restore listing draft:',
            error
          )
        }
      } else {
        const stored = localStorage.getItem(
          'worldwidecre_listing_draft'
        )

        if (stored) {
          try {
            draft = JSON.parse(stored)
          } catch {
            draft = null
          }
        }

        if (!draft) {
          try {
            const restored =
              await restoreLatestListingWizardDraft()

            if (restored?.draftData) {
              draft = restored.draftData
            }
          } catch (error) {
            console.error(
              'Unable to restore listing draft:',
              error
            )
          }
        }
      }

      if (!draft || cancelled) return

      setTransactionType(
        typeof draft.transactionType === 'string'
          ? draft.transactionType
          : 'SALE'
      )

      setCategoryId(
        typeof draft.categoryId === 'string'
          ? draft.categoryId
          : ''
      )

      setPropertyTypeId(
        typeof draft.propertyTypeId === 'string'
          ? draft.propertyTypeId
          : ''
      )

      if (resumeRequested && restoredStep) {
        const routes: Record<number, string> = {
          1: '/dashboard/listings/new',
          2: '/dashboard/listings/new/location',
          3: '/dashboard/listings/new/details',
          4: '/dashboard/listings/new/financial',
          5: '/dashboard/listings/new/description',
          6: '/dashboard/listings/new/media',
          7: '/dashboard/listings/new/contact',
          8: '/dashboard/listings/new/review',
        }

        const destination =
          routes[restoredStep] ??
          '/dashboard/listings/new'

        router.replace(destination)
      }
    }

    loadDraft()

    return () => {
      cancelled = true
    }
  }, [resumeRequested, router])

  const filteredTypes = useMemo(
    () => propertyTypes.filter((type) => type.category_id === categoryId),
    [categoryId, propertyTypes]
  )

  const canContinue = Boolean(categoryId && propertyTypeId)

  return (
    <div className="mt-8">
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            Listing setup
          </p>
          <p className="text-sm font-medium text-slate-500">
            Step 1 of 8
          </p>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[12.5%] rounded-full bg-teal-600" />
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Transaction
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose how this commercial property is being offered.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { value: 'SALE', label: 'For Sale' },
              { value: 'LEASE', label: 'For Lease' },
              { value: 'SUBLEASE', label: 'For Sublease' },
            ].map((option) => {
              const selected = transactionType === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTransactionType(option.value)}
                  className={`rounded-xl border px-4 py-4 text-left transition ${
                    selected
                      ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`block text-sm font-semibold ${
                      selected ? 'text-teal-900' : 'text-slate-800'
                    }`}
                  >
                    {option.label}
                  </span>

                  <span
                    className={`mt-1 block text-xs ${
                      selected ? 'text-teal-700' : 'text-slate-500'
                    }`}
                  >
                    {selected ? 'Selected' : 'Choose this option'}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="border-t border-slate-100 pt-8">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Property classification
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select the category first, then choose the specific property type.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="property-category"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Property category
              </label>

              <select
                id="property-category"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value)
                  setPropertyTypeId('')
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
              >
                <option value="">Select a category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="property-type"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Property type
              </label>

              <select
                id="property-type"
                value={propertyTypeId}
                onChange={(event) => setPropertyTypeId(event.target.value)}
                disabled={!categoryId}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">
                  {categoryId
                    ? 'Select a property type'
                    : 'Select a category first'}
                </option>

                {filteredTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-sky-700 shadow-sm">
              AI
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Built for a faster listing process
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Later steps will use these choices to show only relevant
                commercial property fields and AI assistance.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">
              Your listing starts as a draft
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Nothing is published until you review and submit it.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {saveError && (
              <p className="max-w-md text-right text-xs font-medium text-amber-700">
                {saveError}
              </p>
            )}

            <button
              type="button"
              disabled={!canContinue || isSaving}
              onClick={async () => {
                setIsSaving(true)
                setSaveError('')

                const selectedCategory = categories.find(
                  (category) => category.id === categoryId
                )

                const selectedPropertyType = propertyTypes.find(
                  (type) => type.id === propertyTypeId
                )

                let existingDraft: Record<string, unknown> = {}

                const stored = localStorage.getItem(
                  'worldwidecre_listing_draft'
                )

                if (stored) {
                  try {
                    existingDraft = JSON.parse(stored)
                  } catch {
                    existingDraft = {}
                  }
                }

                const nextDraft = {
                  ...existingDraft,
                  transactionType,
                  categoryId,
                  categoryName: selectedCategory?.name ?? '',
                  propertyTypeId,
                  propertyTypeName: selectedPropertyType?.name ?? '',
                }

                localStorage.setItem(
                  'worldwidecre_listing_draft',
                  JSON.stringify(nextDraft)
                )

                try {
                  const supabase = createClient()

                  const {
                    data: { user },
                  } = await supabase.auth.getUser()

                  if (user) {
                    const existingDraftId = localStorage.getItem(
                      'worldwidecre_listing_draft_id'
                    )

                    let savedDraftId: string | null = null

                    if (existingDraftId) {
                      const { data, error } = await supabase
                        .from('listing_wizard_drafts')
                        .update({
                          current_step: 2,
                          draft_data: nextDraft,
                        })
                        .eq('id', existingDraftId)
                        .eq('user_id', user.id)
                        .select('id')
                        .maybeSingle()

                      if (error) throw error

                      savedDraftId = data?.id ?? null
                    }

                    if (!savedDraftId) {
                      const { data, error } = await supabase
                        .from('listing_wizard_drafts')
                        .insert({
                          user_id: user.id,
                          current_step: 2,
                          draft_data: nextDraft,
                        })
                        .select('id')
                        .single()

                      if (error) throw error

                      savedDraftId = data.id
                    }

                    if (savedDraftId) {
                      localStorage.setItem(
                        'worldwidecre_listing_draft_id',
                        savedDraftId
                      )
                    }
                  }

                  router.push(
                    returnTo === 'review'
                      ? '/dashboard/listings/new/review'
                      : '/dashboard/listings/new/location'
                  )
                } catch (error) {
                  console.error('Unable to save listing draft:', error)

                  setSaveError(
                    'Saved on this device, but the online draft could not be saved yet.'
                  )
                } finally {
                  setIsSaving(false)
                }
              }}
              className="inline-flex min-w-36 items-center justify-center rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? 'Saving…' : 'Continue'}
              {!isSaving && (
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
