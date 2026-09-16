import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConfirmAvailabilityButton from '../confirm-availability-button'
import BulkConfirmListings from './bulk-confirm-listings'
import ListingStatusActions from './[listingId]/listing-status-actions'

function formatDate(value: string | null) {
  if (!value) return 'Not yet'

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ')
}

type SearchParams = {
  status?: string
}

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: listings, error } =
    await supabase
      .from('listings')
      .select(
        `
          id,
          title,
          status,
          transaction_type,
          created_at,
          expires_at,
          last_confirmed_at,
          next_confirmation_at
        `
      )
      .eq('created_by', user.id)
      .order('created_at', {
        ascending: false,
      })

  const confirmationCutoff = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  )

  const selectedStatus = params.status || 'ALL'

  const filteredListings = (listings ?? []).filter(
    (listing) => {
      if (selectedStatus === 'ALL') {
        return true
      }

      if (selectedStatus === 'CLOSED') {
        return [
          'SOLD',
          'LEASED',
          'WITHDRAWN',
          'EXPIRED',
        ].includes(listing.status)
      }

      if (selectedStatus === 'NEEDS_CONFIRMATION') {
        if (listing.status !== 'ACTIVE') {
          return false
        }

        if (!listing.next_confirmation_at) {
          return true
        }

        return (
          new Date(listing.next_confirmation_at) <=
          confirmationCutoff
        )
      }

      return listing.status === selectedStatus
    }
  )

  const needsConfirmation = (listings ?? []).filter(
    (listing) => {
      if (listing.status !== 'ACTIVE') {
        return false
      }

      if (!listing.next_confirmation_at) {
        return true
      }

      return (
        new Date(listing.next_confirmation_at) <=
        confirmationCutoff
      )
    }
  )

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-gray-600 hover:text-gray-950"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Inventory
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              My Listings
            </h1>

            <p className="mt-3 text-gray-600">
              Manage your commercial property inventory
              and keep availability current.
            </p>
          </div>

          <Link
            href="/dashboard/listings/new"
            className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Add Listing
          </Link>
        </div>

        {!error && (
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              ['ALL', 'All', (listings ?? []).length],
              [
                'ACTIVE',
                'Active',
                (listings ?? []).filter(
                  (listing) => listing.status === 'ACTIVE'
                ).length,
              ],
              [
                'NEEDS_CONFIRMATION',
                'Needs Confirmation',
                needsConfirmation.length,
              ],
              [
                'UNDER_REVIEW',
                'Under Review',
                (listings ?? []).filter(
                  (listing) =>
                    listing.status === 'UNDER_REVIEW'
                ).length,
              ],
              [
                'PENDING',
                'Pending',
                (listings ?? []).filter(
                  (listing) => listing.status === 'PENDING'
                ).length,
              ],
              [
                'CLOSED',
                'Closed',
                (listings ?? []).filter((listing) =>
                  [
                    'SOLD',
                    'LEASED',
                    'WITHDRAWN',
                    'EXPIRED',
                  ].includes(listing.status)
                ).length,
              ],
            ].map(([value, label, count]) => {
              const href =
                value === 'ALL'
                  ? '/dashboard/listings'
                  : `/dashboard/listings?status=${value}`

              return (
                <Link
                  key={value}
                  href={href}
                  className={
                    selectedStatus === value
                      ? 'rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white'
                      : 'rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700'
                  }
                >
                  {label} ({count})
                </Link>
              )
            })}
          </div>
        )}

        {!error && needsConfirmation.length > 0 && (
          <div className="mt-10">
            <BulkConfirmListings
              listings={needsConfirmation.map(
                (listing) => ({
                  id: listing.id,
                  title: listing.title,
                  next_confirmation_at:
                    listing.next_confirmation_at,
                })
              )}
            />
          </div>
        )}

        {error ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            {error.message}
          </div>
        ) : (
          <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {filteredListings.length === 0 ? (
              <div className="p-10 text-center text-gray-600">
                You have no listings yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold">
                            {listing.title ||
                              'Untitled Listing'}
                          </h2>

                          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold">
                            {formatStatus(
                              listing.status
                            )}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                          <span>
                            {listing.transaction_type}
                          </span>

                          <span>
                            Submitted{' '}
                            {formatDate(
                              listing.created_at
                            )}
                          </span>

                          {listing.status ===
                            'ACTIVE' && (
                            <>
                              <span>
                                Last confirmed:{' '}
                                {formatDate(
                                  listing.last_confirmed_at
                                )}
                              </span>

                              <span>
                                Confirm again by:{' '}
                                {formatDate(
                                  listing.next_confirmation_at
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <Link
                          href={`/dashboard/listings/${listing.id}`}
                          className="text-sm font-semibold hover:underline"
                        >
                          View
                        </Link>

                        <Link
                          href={`/dashboard/listings/${listing.id}/edit`}
                          className="text-sm font-semibold hover:underline"
                        >
                          Edit
                        </Link>

                        {listing.status ===
                          'ACTIVE' && (
                          <ConfirmAvailabilityButton
                            listingId={listing.id}
                          />
                        )}
                      </div>
                    </div>

                    {[
                      'ACTIVE',
                      'PENDING',
                      'UNDER_REVIEW',
                    ].includes(listing.status) && (
                      <div className="mt-5 border-t border-gray-100 pt-5">
                        <ListingStatusActions
                          listingId={listing.id}
                          status={listing.status}
                          transactionType={listing.transaction_type}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
