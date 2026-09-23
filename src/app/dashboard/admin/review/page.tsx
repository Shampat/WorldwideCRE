import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ReviewListing = {
  listing_id: string
  title: string
  transaction_type: string
  status: string
  created_by: string
  submitted_at: string
  price_amount_minor: number | null
  price_currency: string | null
  price_frequency: string | null
  area_sqm: number | null
  location_privacy: string
  details: Record<string, unknown> | null
  owner_display_name: string | null
}

function formatPrice(listing: ReviewListing) {
  if (listing.price_amount_minor == null) return 'Price not provided'

  const amount = listing.price_amount_minor / 100
  const currency = listing.price_currency?.trim() || 'CAD'

  const frequency =
    listing.price_frequency === 'SQFT_YEAR'
      ? ' / sq ft / year'
      : listing.price_frequency === 'MONTH'
        ? ' / month'
        : listing.price_frequency === 'YEAR'
          ? ' / year'
          : ''

  return `${amount.toLocaleString('en-CA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  })}${frequency}`
}

export default async function AdminReviewPage() {
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

  const { data, error } = await supabase.rpc('get_admin_review_queue')

  if (error) {
    throw new Error(`Unable to load admin review queue: ${error.message}`)
  }

  const listings = (data ?? []) as ReviewListing[]

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              WorldwideCRE Administration
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gray-950">
              Listing Review Queue
            </h1>
            <p className="mt-2 text-gray-600">
              Review listings submitted for marketplace approval.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="text-sm text-gray-500">Awaiting review</div>
            <div className="text-2xl font-bold text-gray-950">
              {listings.length}
            </div>
          </div>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="text-lg font-semibold text-gray-950">
            Review queue is clear
          </h2>
          <p className="mt-2 text-gray-600">
            There are currently no listings waiting for review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <article
              key={listing.listing_id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-5 md:flex-row">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      UNDER REVIEW
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {listing.transaction_type}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-bold text-gray-950">
                    {listing.title}
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    Submitted by{' '}
                    <span className="font-medium text-gray-900">
                      {listing.owner_display_name || 'WorldwideCRE user'}
                    </span>
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                    <span>{formatPrice(listing)}</span>

                    {listing.area_sqm != null && (
                      <span>
                        {Math.round(listing.area_sqm * 10.7639).toLocaleString(
                          'en-CA',
                        )}{' '}
                        sq ft
                      </span>
                    )}

                    <span>
                      Location: {listing.location_privacy}
                    </span>
                  </div>
                </div>

                <div className="flex items-start">
                  <Link
                    href={`/dashboard/admin/review/${listing.listing_id}`}
                    className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-5 py-3 font-semibold text-white hover:bg-gray-800"
                  >
                    Review Listing
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
