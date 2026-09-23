import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewActions from './review-actions'

type ReviewListing = {
  listing_id: string
  property_id: string | null
  title: string | null
  description: string | null
  transaction_type: string
  status: string
  created_by: string
  submitted_at: string
  price_amount_minor: number | null
  price_currency: string | null
  price_frequency: string | null
  area_sqm: number | null
  lot_area_sqm: number | null
  location_privacy: string
  details: Record<string, unknown> | null
  owner_display_name: string | null
  address_line_1: string | null
  address_line_2: string | null
  postal_code: string | null
  city_name: string | null
  region_name: string | null
}

function formatTransaction(value: string) {
  if (value === 'SALE') return 'For Sale'
  if (value === 'LEASE') return 'For Lease'
  if (value === 'SUBLEASE') return 'For Sublease'
  return value
}

function formatArea(areaSqm: number | null) {
  if (areaSqm === null) return 'Not specified'

  const sqft = Number(areaSqm) / 0.09290304

  return `${new Intl.NumberFormat('en-CA', {
    maximumFractionDigits: 0,
  }).format(sqft)} sq ft`
}

function formatPrice(listing: ReviewListing) {
  if (listing.price_amount_minor === null) {
    return 'Not specified'
  }

  const amount =
    Number(listing.price_amount_minor) / 100

  const currency =
    listing.price_currency?.trim() || 'CAD'

  const formatted = new Intl.NumberFormat(
    'en-CA',
    {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }
  ).format(amount)

  const frequency =
    listing.price_frequency === 'SQFT_YEAR'
      ? ' / sq ft / year'
      : listing.price_frequency === 'MONTH'
        ? ' / month'
        : listing.price_frequency === 'YEAR'
          ? ' / year'
          : listing.price_frequency
            ? ` / ${listing.price_frequency}`
            : ''

  return `${formatted}${frequency}`
}

function detailValue(
  details: Record<string, unknown> | null,
  key: string
) {
  const value = details?.[key]

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'Not specified'
  }

  return String(value)
}

function ReviewItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <dt className="text-sm text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-gray-950">
        {value}
      </dd>
    </div>
  )
}

export default async function AdminListingReviewPage({
  params,
}: {
  params: Promise<{ listingId: string }>
}) {
  const { listingId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.platform_role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const { data, error } = await supabase.rpc(
    'get_admin_review_listing',
    {
      p_listing_id: listingId,
    }
  )

  if (error) {
    throw new Error(
      `Unable to load listing for review: ${error.message}`
    )
  }

  const listing = (data?.[0] ??
    null) as ReviewListing | null

  if (!listing) {
    notFound()
  }

  const location = [
    listing.address_line_1,
    listing.address_line_2,
    listing.city_name,
    listing.region_name,
    listing.postal_code,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard/admin/review"
          className="text-sm font-semibold text-gray-600 hover:text-gray-950"
        >
          ← Back to Review Queue
        </Link>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                WorldwideCRE Administration
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                {listing.title || 'Untitled Listing'}
              </h1>

              <p className="mt-2 text-gray-600">
                {formatTransaction(
                  listing.transaction_type
                )}
              </p>
            </div>

            <span className="w-fit rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800">
              Under Review
            </span>
          </div>

          <div className="mt-7 grid gap-5 border-t border-gray-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <ReviewItem
              label="Submitted by"
              value={
                listing.owner_display_name ||
                'WorldwideCRE user'
              }
            />

            <ReviewItem
              label="Price / Rate"
              value={formatPrice(listing)}
            />

            <ReviewItem
              label="Building area"
              value={formatArea(listing.area_sqm)}
            />

            <ReviewItem
              label="Property type"
              value={detailValue(
                listing.details,
                'propertyTypeName'
              )}
            />

            <ReviewItem
              label="Location privacy"
              value={listing.location_privacy}
            />

            <ReviewItem
              label="Submitted"
              value={new Intl.DateTimeFormat(
                'en-CA',
                {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }
              ).format(
                new Date(listing.submitted_at)
              )}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-950">
              Location
            </h2>

            <dl className="mt-5 space-y-4">
              <ReviewItem
                label="Address"
                value={location || 'Not specified'}
              />

              <ReviewItem
                label="Privacy"
                value={listing.location_privacy}
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-950">
              Listing Details
            </h2>

            <dl className="mt-5 space-y-4">
              <ReviewItem
                label="Zoning"
                value={detailValue(
                  listing.details,
                  'zoning'
                )}
              />

              <ReviewItem
                label="Year built"
                value={detailValue(
                  listing.details,
                  'yearBuilt'
                )}
              />

              <ReviewItem
                label="Highlights"
                value={detailValue(
                  listing.details,
                  'highlights'
                )}
              />
            </dl>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-950">
            Description
          </h2>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">
            {listing.description ||
              'No description provided.'}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-6">
          <h2 className="text-lg font-bold text-teal-950">
            Moderation Decision
          </h2>

          <p className="mt-2 text-sm leading-6 text-teal-800">
            Review the submitted information above before making a moderation decision.
          </p>

          <ReviewActions listingId={listing.listing_id} />
        </section>
      </div>
    </main>
  )
}
