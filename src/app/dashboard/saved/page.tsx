import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RemoveSavedButton from './remove-saved-button'

function formatTransactionType(type: string | null) {
  if (type === 'SALE') return 'For Sale'
  if (type === 'LEASE') return 'For Lease'
  if (type === 'SUBLEASE') return 'For Sublease'
  return 'Commercial'
}

function formatMoney(
  amountMinor: number | null,
  currency: string | null,
  frequency: string | null
) {
  if (amountMinor === null) {
    return 'Contact for pricing'
  }

  const formatted = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency || 'CAD',
    maximumFractionDigits: 0,
  }).format(amountMinor / 100)

  const frequencyLabel =
    frequency === 'MONTHLY'
      ? '/ month'
      : frequency === 'ANNUALLY'
        ? '/ year'
        : frequency === 'SQFT_YEAR'
          ? '/ sq ft / year'
          : frequency === 'SQFT_MONTH'
            ? '/ sq ft / month'
            : ''

  return `${formatted} ${frequencyLabel}`.trim()
}

function formatArea(areaSqm: number | null) {
  if (!areaSqm) return null

  const squareFeet =
    Number(areaSqm) * 10.7639

  return `${new Intl.NumberFormat('en-CA', {
    maximumFractionDigits: 0,
  }).format(squareFeet)} sq ft`
}

export default async function SavedPropertiesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: saves } = await supabase
    .from('listing_saves')
    .select('listing_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', {
      ascending: false,
    })

  const savedIds = (saves ?? [])
    .map((save) => save.listing_id)
    .filter(Boolean)

  let listings: any[] = []

  if (savedIds.length > 0) {
    const { data } = await supabase
      .from('public_marketplace_listings')
      .select('*')
      .in('listing_id', savedIds)

    listings = data ?? []
  }

  const listingById = new Map(
    listings.map((listing) => [
      listing.listing_id,
      listing,
    ])
  )

  const orderedListings = savedIds
    .map((id) => listingById.get(id))
    .filter(Boolean)

  const { data: mediaRows } =
    await supabase.rpc(
      'get_public_marketplace_media'
    )

  const firstImagePathByListing =
    new Map<string, string>()

  for (const media of mediaRows ?? []) {
    if (
      media.listing_id &&
      media.storage_path &&
      savedIds.includes(media.listing_id) &&
      !firstImagePathByListing.has(
        media.listing_id
      )
    ) {
      firstImagePathByListing.set(
        media.listing_id,
        media.storage_path
      )
    }
  }

  const imageUrlByListing =
    new Map<string, string>()

  await Promise.all(
    Array.from(
      firstImagePathByListing.entries()
    ).map(
      async ([listingId, storagePath]) => {
        const { data } =
          await supabase.storage
            .from('listing-media')
            .createSignedUrl(
              storagePath,
              60 * 60
            )

        if (data?.signedUrl) {
          imageUrlByListing.set(
            listingId,
            data.signedUrl
          )
        }
      }
    )
  )

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-gray-600 hover:text-gray-950"
            >
              ← Back to Dashboard
            </Link>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Marketplace
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-950">
              Saved Properties
            </h1>

            <p className="mt-3 text-gray-600">
              Commercial properties you want to
              revisit.
            </p>
          </div>

          <Link
            href="/listings"
            className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Browse Properties
          </Link>
        </div>

        {orderedListings.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center">
            <h2 className="text-2xl font-bold text-gray-950">
              No saved properties yet
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-gray-600">
              Save properties while browsing and
              they will appear here.
            </p>

            <Link
              href="/listings"
              className="mt-6 inline-flex rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {orderedListings.map((listing) => {
              const imageUrl =
                imageUrlByListing.get(
                  listing.listing_id
                )

              const location = [
                listing.city_name,
                listing.region_name,
                listing.country_name,
              ]
                .filter(Boolean)
                .join(', ')

              const area = formatArea(
                listing.area_sqm
              )

              return (
                <article
                  key={listing.listing_id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="h-48 bg-gray-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={
                          listing.title ||
                          'Commercial property'
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-center">
                        <div>
                          <p className="text-sm font-semibold text-gray-500">
                            WorldwideCRE
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            No property image available
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-950 px-3 py-1 text-xs font-semibold text-white">
                        {formatTransactionType(
                          listing.transaction_type
                        )}
                      </span>

                      {listing.property_type_name && (
                        <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                          {
                            listing.property_type_name
                          }
                        </span>
                      )}
                    </div>

                    <h2 className="mt-4 text-xl font-bold text-gray-950">
                      {listing.title ||
                        'Commercial Property'}
                    </h2>

                    <p className="mt-2 text-sm text-gray-600">
                      {location ||
                        'Location available on request'}
                    </p>

                    <div className="mt-5 border-t border-gray-100 pt-5">
                      <p className="text-xl font-bold text-gray-950">
                        {formatMoney(
                          listing.price_amount_minor,
                          listing.price_currency,
                          listing.price_frequency
                        )}
                      </p>

                      {area && (
                        <p className="mt-1 text-sm text-gray-500">
                          {area}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3">
                      <Link
                        href={`/listings/${listing.listing_id}`}
                        className="rounded-xl bg-gray-950 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
                      >
                        View Property
                      </Link>

                      <RemoveSavedButton
                        listingId={
                          listing.listing_id
                        }
                      />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {savedIds.length >
          orderedListings.length && (
          <p className="mt-6 text-sm text-gray-500">
            Some previously saved properties are
            no longer active on the marketplace and
            are not currently displayed.
          </p>
        )}
      </div>
    </main>
  )
}
