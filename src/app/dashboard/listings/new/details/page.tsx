'use client'

import {
  mergeLocalListingDraft,
  saveListingWizardDraft,
} from '@/lib/listing-draft'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Suspense, useEffect, useMemo, useState } from 'react'

type Draft = {
  transactionType?: string
  categoryId?: string
  categoryName?: string
  propertyTypeId?: string
  propertyTypeName?: string
  country?: string
  province?: string
  city?: string
  address?: string
  postalCode?: string
  locationPrivacy?: string
}

export default function ListingDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f6f7f9]" />
      }
    >
      <ListingDetailsPageContent />
    </Suspense>
  )
}

function ListingDetailsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const [draft, setDraft] = useState<Draft>({})
  const [title, setTitle] = useState('')
  const [area, setArea] = useState('')
  const [lotArea, setLotArea] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [zoning, setZoning] = useState('')
  const [parkingSpaces, setParkingSpaces] = useState('')
  const [clearHeight, setClearHeight] = useState('')
  const [loadingDocks, setLoadingDocks] = useState('')
  const [frontage, setFrontage] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('worldwidecre_listing_draft')

    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      setDraft(parsed)

      setTitle(parsed.title ?? '')
      setArea(parsed.area ?? '')
      setLotArea(parsed.lotArea ?? '')
      setYearBuilt(parsed.yearBuilt ?? '')
      setZoning(parsed.zoning ?? '')
      setParkingSpaces(parsed.parkingSpaces ?? '')
      setClearHeight(parsed.clearHeight ?? '')
      setLoadingDocks(parsed.loadingDocks ?? '')
      setFrontage(parsed.frontage ?? '')
    } catch {
      setDraft({})
    }
  }, [])

  const category = draft.categoryName?.toLowerCase() ?? ''
  const propertyType = draft.propertyTypeName?.toLowerCase() ?? ''

  const isIndustrial =
    category.includes('industrial') ||
    propertyType.includes('warehouse') ||
    propertyType.includes('manufacturing') ||
    propertyType.includes('flex')

  const isLand =
    category.includes('land') ||
    propertyType.includes('land') ||
    propertyType.includes('development')

  const isHospitality =
    category.includes('hospitality') ||
    propertyType.includes('hotel') ||
    propertyType.includes('motel')

  const sizeLabel = useMemo(() => {
    if (draft.country === 'Canada') return 'Building / unit size (sq ft)'
    return 'Building / unit size'
  }, [draft.country])

  const canContinue = Boolean(title.trim())

  async function continueListing() {
    const nextDraft = mergeLocalListingDraft(
      {
      title: title.trim(),
      area,
      lotArea,
      yearBuilt,
      zoning: zoning.trim(),
      parkingSpaces,
      clearHeight,
      loadingDocks,
      frontage,
    }
    )

    try {
      await saveListingWizardDraft(
        nextDraft,
        4
      )
    } catch (error) {
      console.error(
        'Online draft save failed. Local draft was preserved:',
        error
      )
    }

    router.push(
      returnTo === 'review'
        ? '/dashboard/listings/new/review'
        : '/dashboard/listings/new/financial'
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <header className="border-b border-slate-200 bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            WorldwideCRE
          </Link>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
            Commercial Property Listing
          </span>
        </div>
      </header>

      <div className="px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/dashboard/listings/new/location"
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            ← Back to Property & Location
          </Link>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 px-8 py-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
                Create Listing
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Property Details
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Add the most important physical details. Later steps will handle
                pricing, description, photos, documents and publication.
              </p>
            </div>

            <div className="px-8 py-8 sm:px-10 sm:py-10">
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Property information
                  </p>

                  <p className="text-sm font-medium text-slate-500">
                    Step 3 of 8
                  </p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[37.5%] rounded-full bg-teal-600" />
                </div>
              </div>

              {(draft.categoryName || draft.propertyTypeName) && (
                <div className="mb-8 flex flex-wrap gap-2">
                  {draft.categoryName && (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      {draft.categoryName}
                    </span>
                  )}

                  {draft.propertyTypeName && (
                    <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">
                      {draft.propertyTypeName}
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Listing title
                </label>

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Example: Modern Industrial Warehouse in Mississauga"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Keep it factual. AI can help improve the title later.
                </p>
              </div>

              <section className="mt-8 border-t border-slate-100 pt-8">
                <h2 className="text-base font-semibold text-slate-900">
                  Size & physical characteristics
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter what you know. Optional fields can be completed later.
                </p>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <Field
                    label={sizeLabel}
                    value={area}
                    onChange={setArea}
                    placeholder="10000"
                    inputMode="decimal"
                  />

                  <Field
                    label="Lot size (acres)"
                    value={lotArea}
                    onChange={setLotArea}
                    placeholder="2.5"
                    inputMode="decimal"
                  />

                  {!isLand && (
                    <Field
                      label="Year built"
                      value={yearBuilt}
                      onChange={setYearBuilt}
                      placeholder="2018"
                      inputMode="numeric"
                    />
                  )}

                  <Field
                    label="Zoning"
                    value={zoning}
                    onChange={setZoning}
                    placeholder="Example: E2 Industrial"
                  />

                  {!isLand && (
                    <Field
                      label="Parking spaces"
                      value={parkingSpaces}
                      onChange={setParkingSpaces}
                      placeholder="24"
                      inputMode="numeric"
                    />
                  )}

                  {isIndustrial && (
                    <>
                      <Field
                        label="Clear height (ft)"
                        value={clearHeight}
                        onChange={setClearHeight}
                        placeholder="28"
                        inputMode="decimal"
                      />

                      <Field
                        label="Loading docks / doors"
                        value={loadingDocks}
                        onChange={setLoadingDocks}
                        placeholder="4"
                        inputMode="numeric"
                      />
                    </>
                  )}

                  {isLand && (
                    <Field
                      label="Frontage"
                      value={frontage}
                      onChange={setFrontage}
                      placeholder="Example: 250 ft"
                    />
                  )}
                </div>
              </section>

              {isIndustrial && (
                <div className="mt-8 rounded-2xl border border-teal-100 bg-teal-50/70 p-5">
                  <p className="text-sm font-semibold text-teal-950">
                    Industrial property detected
                  </p>

                  <p className="mt-1 text-sm leading-6 text-teal-800">
                    WorldwideCRE is showing industrial-specific fields such as
                    clear height and loading because they are important to
                    warehouse and industrial buyers.
                  </p>
                </div>
              )}

              {isLand && (
                <div className="mt-8 rounded-2xl border border-teal-100 bg-teal-50/70 p-5">
                  <p className="text-sm font-semibold text-teal-950">
                    Land listing detected
                  </p>

                  <p className="mt-1 text-sm leading-6 text-teal-800">
                    Land-specific information such as zoning, acreage and
                    frontage is being prioritized for this listing.
                  </p>
                </div>
              )}

              {isHospitality && (
                <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Hospitality details
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Additional hotel and motel operating details can be added in
                    later specialized fields without making this step too long.
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    You can refine these details before publishing
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Unknown information should be left blank rather than guessed.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={continueListing}
                  className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  inputMode?: 'text' | 'numeric' | 'decimal'
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
      />
    </div>
  )
}
