import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ListingFilters from './listing-filters'

function formatTransactionType(type: string | null) {
  if (type === 'SALE') return 'For Sale'
  if (type === 'LEASE') return 'For Lease'
  if (type === 'SUBLEASE') return 'For Sublease'
  return type || 'Commercial'
}

function formatMoney(
  amountMinor: number | null,
  currency: string | null,
  frequency: string | null
) {
  if (amountMinor === null) {
    return 'Contact for pricing'
  }

  const amount = amountMinor / 100

  const formatted = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency || 'CAD',
    maximumFractionDigits: 0,
  }).format(amount)

  if (!frequency) {
    return formatted
  }

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
  if (!areaSqm) {
    return null
  }

  const squareFeet = areaSqm * 10.7639

  return `${new Intl.NumberFormat('en-CA', {
    maximumFractionDigits: 0,
  }).format(squareFeet)} sq ft`
}

function formatLocation(
  city: string | null,
  region: string | null,
  country: string | null
) {
  return [city, region, country]
    .filter(Boolean)
    .join(', ')
}

function formatFreshness(
  lastConfirmedAt: string | null
) {
  if (!lastConfirmedAt) {
    return null
  }

  const confirmed = new Date(lastConfirmedAt)
  const now = new Date()

  if (Number.isNaN(confirmed.getTime())) {
    return null
  }

  const diffMs =
    now.getTime() - confirmed.getTime()

  const days = Math.max(
    0,
    Math.floor(diffMs / (1000 * 60 * 60 * 24))
  )

  if (days === 0) {
    return 'Confirmed today'
  }

  if (days === 1) {
    return 'Confirmed yesterday'
  }

  if (days < 7) {
    return `Confirmed ${days} days ago`
  }

  const weeks = Math.floor(days / 7)

  if (weeks === 1) {
    return 'Confirmed 1 week ago'
  }

  if (days < 30) {
    return `Confirmed ${weeks} weeks ago`
  }

  return 'Availability confirmation due'
}

function getDemoImage(
  title: string | null,
  propertyType: string | null
) {
  if (!title?.startsWith('DEMO ')) {
    return null
  }

  const type = (propertyType ?? '').toLowerCase()

  if (
    type.includes('office') ||
    type.includes('medical')
  ) {
    return '/demo-media/office.png'
  }

  if (
    type.includes('retail') ||
    type.includes('restaurant')
  ) {
    return '/demo-media/retail.png'
  }

  if (
    type.includes('industrial') ||
    type.includes('warehouse')
  ) {
    return '/demo-media/industrial-warehouse.png'
  }

  if (type.includes('mixed')) {
    return '/demo-media/mixed-use.png'
  }

  if (
    type.includes('land') ||
    type.includes('farm')
  ) {
    return '/demo-media/land.png'
  }

  if (
    type.includes('hotel') ||
    type.includes('motel') ||
    type.includes('hospitality')
  ) {
    return '/demo-media/hotel-hospitality.png'
  }

  if (
    type.includes('storage') ||
    type.includes('mini storage')
  ) {
    return '/demo-media/self-storage.png'
  }

  if (
    type.includes('gas') ||
    type.includes('service station')
  ) {
    return '/demo-media/gas-station.png'
  }

  if (type.includes('automotive')) {
    return '/demo-media/automotive.png'
  }

  if (
    type.includes('apartment') ||
    type.includes('multifamily') ||
    type.includes('multi-family')
  ) {
    return '/demo-media/multifamily-apartment.png'
  }

  if (
    type.includes('investment') ||
    type.includes('income')
  ) {
    return '/demo-media/investment-income.png'
  }

  if (
    type.includes('development') ||
    type.includes('special purpose')
  ) {
    return '/demo-media/development-special-purpose.png'
  }

  return '/demo-media/investment-income.png'
}

type SearchParams = {
  keyword?: string
  transaction?: string
  propertyType?: string
  region?: string
  city?: string
  minPrice?: string
  maxPrice?: string
  rateBasis?: string
  sort?: string
  page?: string
}

function buildListingsPageUrl(
  params: SearchParams,
  page: number
) {
  const query = new URLSearchParams()

  if (params.keyword) {
    query.set('keyword', params.keyword)
  }

  if (params.transaction) {
    query.set('transaction', params.transaction)
  }

  if (params.propertyType) {
    query.set('propertyType', params.propertyType)
  }

  if (params.region) {
    query.set('region', params.region)
  }

  if (params.city) {
    query.set('city', params.city)
  }

  if (params.minPrice) {
    query.set('minPrice', params.minPrice)
  }

  if (params.maxPrice) {
    query.set('maxPrice', params.maxPrice)
  }

  if (params.rateBasis) {
    query.set('rateBasis', params.rateBasis)
  }

  if (
    params.sort === 'price_asc' ||
    params.sort === 'price_desc'
  ) {
    query.set('sort', params.sort)
  }

  if (page > 1) {
    query.set('page', String(page))
  }

  const value = query.toString()

  return value
    ? `/listings?${value}`
    : '/listings'
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const parsedPage = Number(params.page)

  const currentPage =
    Number.isInteger(parsedPage) &&
    parsedPage > 0
      ? parsedPage
      : 1

  const pageSize = 24
  const rangeFrom =
    (currentPage - 1) * pageSize
  const rangeTo =
    rangeFrom + pageSize - 1

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  /*
   * Property types come from active marketplace listings.
   * Regions and cities come from the canonical location tables
   * so users can browse all supported Canadian locations.
   */
  const { data: filterRows } = await supabase
    .from('public_marketplace_listings')
    .select(
      `
        property_type_id,
        property_type_name
      `
    )

  const { data: regionRows } = await supabase
    .from('regions')
    .select('id, name')
    .eq('active', true)
    .order('name')

  const { data: cityRows } = await supabase
    .from('cities')
    .select('id, name, region_id')
    .eq('active', true)
    .order('name')

  const propertyTypes = Array.from(
    new Map(
      (filterRows ?? [])
        .filter(
          (row) =>
            row.property_type_id &&
            row.property_type_name
        )
        .map((row) => [
          row.property_type_id,
          {
            id: row.property_type_id,
            name: row.property_type_name,
          },
        ])
    ).values()
  ).sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  )

  const regions = (regionRows ?? []).map(
    (region) => ({
      id: region.id,
      name: region.name,
    })
  )

  const cities = (cityRows ?? []).map(
    (city) => ({
      id: city.id,
      name: city.name,
      regionId: city.region_id,
    })
  )

  let query = supabase
    .from('public_marketplace_listings')
    .select('*', {
      count: 'exact',
    })

  const keywordTokens = (params.keyword ?? '')
    .trim()
    .split(/\s+/)
    .map((token) =>
      token.replace(/[,%()]/g, '')
    )
    .filter(Boolean)
    .slice(0, 8)

  for (const token of keywordTokens) {
    query = query.or(
      [
        `title.ilike.%${token}%`,
        `description.ilike.%${token}%`,
        `property_type_name.ilike.%${token}%`,
        `city_name.ilike.%${token}%`,
        `region_name.ilike.%${token}%`,
      ].join(',')
    )
  }

  if (
    params.transaction === 'SALE' ||
    params.transaction === 'LEASE' ||
    params.transaction === 'SUBLEASE'
  ) {
    query = query.eq(
      'transaction_type',
      params.transaction
    )
  }

  if (params.propertyType) {
    query = query.eq(
      'property_type_id',
      params.propertyType
    )
  }

  if (params.region) {
    query = query.eq(
      'region_id',
      params.region
    )
  }

  if (params.city) {
    query = query.eq(
      'city_id',
      params.city
    )
  }

  const minPrice = Number(params.minPrice)
  const maxPrice = Number(params.maxPrice)

  const isSale = params.transaction === 'SALE'

  const isLeaseLike =
    params.transaction === 'LEASE' ||
    params.transaction === 'SUBLEASE'

  const rateBasis =
    isLeaseLike && params.rateBasis
      ? params.rateBasis
      : ''

  if (rateBasis) {
    query = query.eq('price_frequency', rateBasis)
  }

  if (
    (isSale || Boolean(rateBasis)) &&
    params.minPrice &&
    Number.isFinite(minPrice) &&
    minPrice >= 0
  ) {
    query = query.gte(
      'price_amount_minor',
      Math.round(minPrice * 100)
    )
  }

  if (
    (isSale || Boolean(rateBasis)) &&
    params.maxPrice &&
    Number.isFinite(maxPrice) &&
    maxPrice >= 0
  ) {
    query = query.lte(
      'price_amount_minor',
      Math.round(maxPrice * 100)
    )
  }

  query = query.order('is_featured', {
    ascending: false,
  })

  if (
    params.sort === 'price_asc' &&
    (isSale || Boolean(rateBasis))
  ) {
    query = query.order('price_amount_minor', {
      ascending: true,
      nullsFirst: false,
    })
  } else if (
    params.sort === 'price_desc' &&
    (isSale || Boolean(rateBasis))
  ) {
    query = query.order('price_amount_minor', {
      ascending: false,
      nullsFirst: false,
    })
  } else {
    query = query.order('published_at', {
      ascending: false,
    })
  }

  const {
    data: listings,
    error,
    count,
  } = await query.range(
    rangeFrom,
    rangeTo
  )

  const totalCount = count ?? 0

  const totalPages = Math.ceil(
    totalCount / pageSize
  )

  const showingFrom =
    totalCount === 0
      ? 0
      : rangeFrom + 1

  const showingTo = Math.min(
    rangeFrom + (listings?.length ?? 0),
    totalCount
  )

  const { data: mediaRows } = await supabase.rpc(
    'get_public_marketplace_media'
  )

  const firstImagePathByListing =
    new Map<string, string>()

  for (const media of mediaRows ?? []) {
    if (
      media.listing_id &&
      media.storage_path &&
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
        const { data } = await supabase.storage
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

  const hasFilters = Boolean(
    params.keyword ||
      params.transaction ||
      params.propertyType ||
      params.region ||
      params.city ||
      params.minPrice ||
      params.maxPrice ||
      params.rateBasis
  )

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-xl font-bold text-gray-950"
          >
            WorldwideCRE
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-950"
            >
              Home
            </Link>

            {user ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth"
                className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="border-b border-gray-200 bg-white px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
            Commercial Real Estate
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-950">
                Properties for sale and lease
              </h1>

              <p className="mt-3 max-w-2xl text-gray-600">
                Browse active commercial property
                listings and connect directly with
                listing representatives.
              </p>
            </div>

            <div className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
              {totalCount}{' '}
              {totalCount === 1
                ? 'listing found'
                : 'listings found'}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white px-6 py-6">
        <ListingFilters
          propertyTypes={propertyTypes.map((type) => ({
            id: String(type.id),
            name: String(type.name),
          }))}
          regions={regions.map((region) => ({
            id: String(region.id),
            name: String(region.name),
          }))}
          cities={cities.map((city) => ({
            id: String(city.id),
            name: String(city.name),
            regionId: String(city.regionId),
          }))}
          initialKeyword={
            params.keyword || ''
          }
          initialTransaction={
            params.transaction || ''
          }
          initialPropertyType={
            params.propertyType || ''
          }
          initialRegion={
            params.region || ''
          }
          initialCity={
            params.city || ''
          }
          initialMinPrice={
            params.minPrice || ''
          }
          initialMaxPrice={
            params.maxPrice || ''
          }
          initialRateBasis={
            params.rateBasis || ''
          }
          initialSort={
            params.sort || 'newest'
          }
        />
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <p className="font-semibold text-red-900">
                Listings could not be loaded
              </p>

              <p className="mt-2 text-sm text-red-700">
                {error.message}
              </p>
            </div>
          ) : listings &&
            listings.length > 0 ? (
            <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => {
                const location = formatLocation(
                  listing.city_name,
                  listing.region_name,
                  listing.country_name
                )

                const area = formatArea(
                  listing.area_sqm
                )

                const freshness =
                  formatFreshness(
                    listing.last_confirmed_at
                  )

                const imageUrl =
                  imageUrlByListing.get(
                    listing.listing_id
                  ) ??
                  getDemoImage(
                    listing.title,
                    listing.property_type_name
                  )

                return (
                  <article
                    key={listing.listing_id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
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
                      <div className="flex flex-wrap items-center gap-2">
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

                        {listing.is_featured && (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                            Featured
                          </span>
                        )}
                      </div>

                      <h2 className="mt-4 text-xl font-bold leading-7 text-gray-950">
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

                      <div className="mt-5 border-t border-gray-100 pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {freshness && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                              {freshness}
                            </span>
                          )}

                          <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                            {listing.location_privacy ===
                            'EXACT'
                              ? 'Exact location'
                              : listing.location_privacy ===
                                  'APPROXIMATE'
                                ? 'Approximate location'
                                : 'Confidential location'}
                          </span>
                        </div>

                        <Link
                          href={`/listings/${listing.listing_id}`}
                          className="mt-4 flex w-full items-center justify-between rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                        >
                          <span>View property</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {showingFrom}–{showingTo} of{' '}
                    {totalCount} properties
                  </p>

                  <div className="flex items-center gap-3">
                    {currentPage > 1 ? (
                      <Link
                        href={buildListingsPageUrl(
                          params,
                          currentPage - 1
                        )}
                        className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        ← Previous
                      </Link>
                    ) : (
                      <span className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400">
                        ← Previous
                      </span>
                    )}

                    <span className="text-sm font-semibold text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>

                    {currentPage < totalPages ? (
                      <Link
                        href={buildListingsPageUrl(
                          params,
                          currentPage + 1
                        )}
                        className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Next →
                      </Link>
                    ) : (
                      <span className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400">
                        Next →
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center">
              <h2 className="text-2xl font-bold text-gray-950">
                No properties match these filters
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-gray-600">
                Try changing or clearing one or
                more filters.
              </p>

              {hasFilters && (
                <Link
                  href="/listings"
                  className="mt-6 inline-flex rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Clear all filters
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl text-sm text-gray-500">
          © 2026 WorldwideCRE
        </div>
      </footer>
    </main>
  )
}
