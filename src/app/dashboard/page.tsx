import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConfirmAvailabilityButton from './confirm-availability-button'

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatTransactionType(type: string) {
  if (type === 'SALE') return 'For Sale'
  if (type === 'LEASE') return 'For Lease'
  if (type === 'SUBLEASE') return 'For Sublease'

  return type
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  let draftCount = 0
  let activeCount = 0
  let underReviewCount = 0
  let expiringSoonCount = 0
  let savedCount = 0
  let savedSearchCount = 0
  let hasDraft = false

  let listings: {
    id: string
    title: string | null
    status: string
    transaction_type: string
    created_at: string
    expires_at: string | null
    last_confirmed_at: string | null
    next_confirmation_at: string | null
  }[] = []

  if (user) {
    const now = new Date()
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    )

    const [
      draftResult,
      activeResult,
      underReviewResult,
      expiringResult,
      savedResult,
      savedSearchResult,
      listingsResult,
    ] = await Promise.all([
      supabase
        .from('listing_wizard_drafts')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('user_id', user.id),

      supabase
        .from('listings')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('created_by', user.id)
        .eq('status', 'ACTIVE'),

      supabase
        .from('listings')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('created_by', user.id)
        .eq('status', 'UNDER_REVIEW'),

      supabase
        .from('listings')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('created_by', user.id)
        .eq('status', 'ACTIVE')
        .not('expires_at', 'is', null)
        .gte('expires_at', now.toISOString())
        .lte('expires_at', thirtyDaysFromNow.toISOString()),

      supabase
        .from('listing_saves')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('user_id', user.id),

      supabase
        .from('saved_searches')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('user_id', user.id),

      supabase
        .from('listings')
        .select(
          'id, title, status, transaction_type, created_at, expires_at, last_confirmed_at, next_confirmation_at'
        )
        .eq('created_by', user.id)
        .order('created_at', {
          ascending: false,
        })
        .limit(10),
    ])

    draftCount = draftResult.count ?? 0
    activeCount = activeResult.count ?? 0
    underReviewCount = underReviewResult.count ?? 0
    expiringSoonCount = expiringResult.count ?? 0
    savedCount = savedResult.count ?? 0
    savedSearchCount = savedSearchResult.count ?? 0

    hasDraft = draftCount > 0

    listings = listingsResult.data ?? []
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Dashboard
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
              Welcome to WorldwideCRE
            </h1>

            <p className="mt-3 text-gray-600">
              Manage your commercial listings and marketplace activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 hover:bg-gray-50"
            >
              Professional Profile
            </Link>

            <Link
              href="/dashboard/listings"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 hover:bg-gray-50"
            >
              My Listings
            </Link>

            <Link
              href="/dashboard/saved"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 hover:bg-gray-50"
            >
              Saved Properties
            </Link>

            <Link
              href="/dashboard/saved-searches"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 hover:bg-gray-50"
            >
              Saved Searches
            </Link>

            <Link
              href={
                hasDraft
                  ? '/dashboard/listings/new?resume=1'
                  : '/dashboard/listings/new'
              }
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-700"
            >
              {hasDraft ? 'Resume Listing' : 'Create Listing'}
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">Active Listings</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">Under Review</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {underReviewCount}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">Draft Listings</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {draftCount}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">Expiring Soon</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {expiringSoonCount}
            </p>
          </div>

          <Link
            href="/dashboard/saved"
            className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-gray-300 hover:shadow-sm"
          >
            <p className="text-sm text-gray-500">
              Saved Properties
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {savedCount}
            </p>
          </Link>

          <Link
            href="/dashboard/saved-searches"
            className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-gray-300 hover:shadow-sm"
          >
            <p className="text-sm text-gray-500">
              Saved Searches
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {savedSearchCount}
            </p>
          </Link>
        </div>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-bold text-gray-900">
              My Listings
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your most recently submitted commercial listings.
            </p>
          </div>

          {listings.length === 0 ? (
            <div className="px-6 py-10">
              <p className="text-sm text-gray-600">
                You have not submitted any listings yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {listing.title || 'Untitled Listing'}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>
                        {formatTransactionType(
                          listing.transaction_type
                        )}
                      </span>

                      <span>
                        Submitted {formatDate(listing.created_at)}
                      </span>

                      {listing.status === 'ACTIVE' &&
                        listing.last_confirmed_at && (
                          <span>
                            Confirmed{' '}
                            {formatDate(
                              listing.last_confirmed_at
                            )}
                          </span>
                        )}

                      {listing.status === 'ACTIVE' &&
                        listing.next_confirmation_at && (
                          <span>
                            Confirm again by{' '}
                            {formatDate(
                              listing.next_confirmation_at
                            )}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700">
                      {formatStatus(listing.status)}
                    </span>

                    <Link
                      href={`/dashboard/listings/${listing.id}`}
                      className="text-sm font-semibold text-gray-900 hover:underline"
                    >
                      View
                    </Link>

                    {listing.status === 'ACTIVE' && (
                      <ConfirmAvailabilityButton
                        listingId={listing.id}
                      />
                    )}

                    {listing.status === 'DRAFT' && (
                      <Link
                        href={`/dashboard/listings/${listing.id}/edit`}
                        className="text-sm font-semibold text-gray-900 hover:underline"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Signed in as</p>

          <p className="mt-1 font-medium text-gray-900">
            {user?.email ?? 'Local development mode'}
          </p>

          <form action="/auth/signout" method="post" className="mt-6">
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
