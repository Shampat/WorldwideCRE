'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Draft = Record<string, unknown>

export default function ReviewPage() {
  const router = useRouter()

  const [draft, setDraft] = useState<Draft>({})
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false)
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('worldwidecre_listing_draft')
    if (!stored) return

    try {
      setDraft(JSON.parse(stored))
    } catch {
      setDraft({})
    }
  }, [])

  const sourceListingId =
    typeof draft.sourceListingId === 'string'
      ? draft.sourceListingId
      : ''

  const isEditingExistingListing =
    Boolean(sourceListingId)

  const transaction =
    draft.transactionType === 'SALE'
      ? 'For Sale'
      : draft.transactionType === 'LEASE'
      ? 'For Lease'
      : 'For Sublease'

  const price =
    draft.transactionType === 'LEASE' ||
    draft.transactionType === 'SUBLEASE'
      ? draft.leaseRate
      : draft.salePrice

  const leaseFrequency =
    draft.leaseFrequency ??
    draft.leaseRateBasis

  const leaseFrequencyLabel =
    leaseFrequency === 'SQFT_YEAR'
      ? ' / sq ft / year'
      : leaseFrequency === 'ANNUAL'
      ? ' / year'
      : leaseFrequency === 'MONTHLY'
      ? ' / month'
      : ''

  const priceDisplay =
    price
      ? `$${Number(price).toLocaleString()} CAD${
          draft.transactionType === 'LEASE' ||
          draft.transactionType === 'SUBLEASE'
            ? leaseFrequencyLabel
            : ''
        }`
      : ''

  const leaseRateDisplay =
    draft.leaseRate
      ? `$${Number(
          draft.leaseRate
        ).toLocaleString()} CAD${leaseFrequencyLabel}`
      : ''

  const missingItems = [
    !draft.title && {
      label: 'Listing title',
      href: '/dashboard/listings/new/details',
    },
    !draft.area && {
      label: 'Square footage / property size',
      href: '/dashboard/listings/new/details',
    },
    !draft.city && {
      label: 'City',
      href: '/dashboard/listings/new/location',
    },
    !draft.description && {
      label: 'Property description',
      href: '/dashboard/listings/new/description',
    },
    !draft.contactName && {
      label: 'Representative name',
      href: '/dashboard/listings/new/contact',
    },
    !draft.contactEmail && {
      label: 'Representative email',
      href: '/dashboard/listings/new/contact',
    },
  ].filter(Boolean) as { label: string; href: string }[]

  async function submitListing() {
    if (
      missingItems.length > 0 ||
      !accuracyConfirmed ||
      !authorityConfirmed
    ) {
      return
    }

    const draftId = localStorage.getItem(
      'worldwidecre_listing_draft_id'
    )

    if (!draftId) {
      setSubmitError(
        'The saved draft could not be identified. Please return to the dashboard and resume the listing.'
      )
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const supabase = createClient()

      if (isEditingExistingListing) {
        const { error } = await supabase.rpc(
          'update_listing_wizard_draft',
          {
            p_draft_id: draftId,
          }
        )

        if (error) throw error

        localStorage.removeItem(
          'worldwidecre_listing_draft'
        )

        localStorage.removeItem(
          'worldwidecre_listing_draft_id'
        )

        router.push(
          `/dashboard/listings/${sourceListingId}?updated=1`
        )
        router.refresh()
        return
      }

      const { error } = await supabase.rpc(
        'submit_listing_wizard_draft',
        {
          p_draft_id: draftId,
        }
      )

      if (error) throw error

      localStorage.removeItem(
        'worldwidecre_listing_draft'
      )

      localStorage.removeItem(
        'worldwidecre_listing_draft_id'
      )

      router.push('/dashboard?submitted=1')
      router.refresh()
    } catch (error) {
      const rpcError =
        error &&
        typeof error === 'object'
          ? (error as {
              message?: string
              details?: string
              hint?: string
              code?: string
            })
          : null

      const parts = [
        rpcError?.message,
        rpcError?.details,
        rpcError?.hint,
        rpcError?.code
          ? `Error code: ${rpcError.code}`
          : '',
      ].filter(Boolean)

      setSubmitError(
        parts.length > 0
          ? parts.join(' — ')
          : error instanceof Error
            ? error.message
            : isEditingExistingListing
              ? 'The listing changes could not be saved. Please try again.'
              : 'The listing could not be submitted. Please try again.'
      )

      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <header className="bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-lg font-bold text-white">
            WorldwideCRE
          </Link>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            Commercial Property Listing
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/dashboard/listings/new/contact"
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          ← Back to Representative
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-8 py-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
              Final Review
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Review your listing
            </h1>

            <p className="mt-3 text-sm text-slate-300">
              Check everything carefully. You can jump back to any section
              without losing your progress.
            </p>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-8">
              <div className="mb-3 flex justify-between text-sm">
                <span className="font-semibold text-slate-700">
                  Review & publish
                </span>
                <span className="text-slate-500">
                  Step 8 of 8
                </span>
              </div>

              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-full w-full rounded-full bg-teal-600" />
              </div>
            </div>

            {missingItems.length > 0 && (
              <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-semibold text-amber-950">
                  Some information is missing
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  You can fix these items directly without restarting the listing.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {missingItems.map((item) => (
                    <Link
                      key={item.label}
                      href={`${item.href}?returnTo=review`}
                      className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      Fix {item.label} →
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <ReviewSection
              title="Property"
              editHref="/dashboard/listings/new/details?returnTo=review"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                    {transaction}
                  </span>

                  <h2 className="mt-4 text-2xl font-bold text-slate-950">
                    {String(draft.title ?? 'Untitled commercial property')}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    {[draft.city, draft.province, draft.country]
                      .filter(Boolean)
                      .join(', ') || 'Location not provided'}
                  </p>
                </div>

                {Boolean(priceDisplay) && (
                  <p className="text-xl font-bold text-slate-950">
                    {priceDisplay}
                  </p>
                )}
              </div>

              <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 md:grid-cols-3">
                <Summary label="Property type" value={draft.propertyTypeName} />
                <Summary
                  label="Size"
                  value={draft.area ? `${draft.area} sq ft` : ''}
                />
                <Summary label="Zoning" value={draft.zoning} />
                <Summary label="Location privacy" value={draft.locationPrivacy} />
              </div>
            </ReviewSection>

            <ReviewSection
              title="Location"
              editHref="/dashboard/listings/new/location?returnTo=review"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Summary label="Country" value={draft.country} />
                <Summary label="Province / State" value={draft.province} />
                <Summary label="City" value={draft.city} />
                <Summary label="Postal code" value={draft.postalCode} />
                <Summary label="Street address" value={draft.address} />
                <Summary label="Privacy level" value={draft.locationPrivacy} />
              </div>
            </ReviewSection>

            <ReviewSection
              title="Financial"
              editHref="/dashboard/listings/new/financial?returnTo=review"
            >
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <Summary label="Transaction" value={transaction} />
                <Summary label="Sale price" value={draft.salePrice} />
                <Summary
                  label="Lease rate"
                  value={leaseRateDisplay}
                />
                <Summary label="Property taxes" value={draft.propertyTaxes} />
                <Summary label="NOI" value={draft.noi} />
                <Summary label="Cap rate" value={draft.capRate} />
              </div>
            </ReviewSection>

            <ReviewSection
              title="Description"
              editHref="/dashboard/listings/new/description?returnTo=review"
            >
              <SummaryBlock value={draft.description} />

              {Boolean(draft.highlights) && (
                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Highlights
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {String(draft.highlights)}
                  </p>
                </div>
              )}
            </ReviewSection>

            <ReviewSection
              title="Media & Documents"
              editHref="/dashboard/listings/new/media?returnTo=review"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <Summary
                  label="Images selected"
                  value={draft.selectedImageCount}
                />
                <Summary
                  label="Documents selected"
                  value={draft.selectedDocumentCount}
                />
                <Summary
                  label="Virtual tour"
                  value={draft.virtualTour ? 'Provided' : ''}
                />
              </div>
            </ReviewSection>

            <ReviewSection
              title="Representative"
              editHref="/dashboard/listings/new/contact?returnTo=review"
            >
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <Summary label="Name" value={draft.contactName} />
                <Summary label="Role" value={draft.contactRole} />
                <Summary label="Company" value={draft.company} />
                <Summary label="Email" value={draft.contactEmail} />
                <Summary label="Phone" value={draft.contactPhone} />
                <Summary label="WhatsApp" value={draft.whatsapp} />
              </div>
            </ReviewSection>

            <div className="mt-6 space-y-3">
              <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={accuracyConfirmed}
                  onChange={(e) => setAccuracyConfirmed(e.target.checked)}
                  className="mt-1"
                />

                <span className="text-sm text-slate-700">
                  I confirm that the listing information is accurate to the best
                  of my knowledge.
                </span>
              </label>

              <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={authorityConfirmed}
                  onChange={(e) => setAuthorityConfirmed(e.target.checked)}
                  className="mt-1"
                />

                <span className="text-sm text-slate-700">
                  I confirm that I am authorized to advertise or represent this
                  commercial property.
                </span>
              </label>
            </div>

            <div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-5">
              <p className="text-sm font-semibold text-teal-950">
                {isEditingExistingListing
                  ? 'Ready to save changes'
                  : 'Ready for review'}
              </p>

              <p className="mt-1 text-sm leading-6 text-teal-800">
                {isEditingExistingListing
                  ? 'Review your updates carefully. Saving will update this existing listing without creating a duplicate.'
                  : 'Submitting creates the listing in UNDER_REVIEW status. It will not become publicly active automatically.'}
              </p>
            </div>

            {submitError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">
                  {submitError}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                {isEditingExistingListing
                  ? 'Your existing listing will be updated when you save.'
                  : 'Nothing has been published publicly.'}
              </p>

              <button
                type="button"
                onClick={submitListing}
                disabled={
                  missingItems.length > 0 ||
                  !accuracyConfirmed ||
                  !authorityConfirmed ||
                  isSubmitting
                }
                className="rounded-xl bg-teal-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting
                  ? isEditingExistingListing
                    ? 'Saving...'
                    : 'Submitting...'
                  : isEditingExistingListing
                    ? 'Save Changes'
                    : 'Submit for Review'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function ReviewSection({
  title,
  editHref,
  children,
}: {
  title: string
  editHref: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="font-semibold text-slate-900">
          {title}
        </h3>

        <Link
          href={editHref}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-800"
        >
          Edit
        </Link>
      </div>

      {children}
    </section>
  )
}

function Summary({
  label,
  value,
}: {
  label: string
  value: unknown
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-semibold ${
          value ? 'text-slate-800' : 'text-amber-700'
        }`}
      >
        {value ? String(value) : 'Not provided'}
      </p>
    </div>
  )
}

function SummaryBlock({ value }: { value: unknown }) {
  return (
    <p
      className={`whitespace-pre-line text-sm leading-7 ${
        value ? 'text-slate-600' : 'font-medium text-amber-700'
      }`}
    >
      {value ? String(value) : 'Not provided'}
    </p>
  )
}
