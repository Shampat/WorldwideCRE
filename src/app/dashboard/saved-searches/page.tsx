import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DeleteSavedSearchButton from './delete-saved-search-button'

type SearchCriteria = {
  keyword?: string
  transaction?: string
  rateBasis?: string
  propertyType?: string
  region?: string
  city?: string
  minPrice?: string
  maxPrice?: string
  sort?: string
}

function buildSearchUrl(
  criteria: SearchCriteria | null
) {
  const params = new URLSearchParams()

  if (!criteria) {
    return '/listings'
  }

  if (criteria.keyword) {
    params.set('keyword', criteria.keyword)
  }

  if (criteria.transaction) {
    params.set(
      'transaction',
      criteria.transaction
    )
  }

  if (criteria.rateBasis) {
    params.set(
      'rateBasis',
      criteria.rateBasis
    )
  }

  if (criteria.propertyType) {
    params.set(
      'propertyType',
      criteria.propertyType
    )
  }

  if (criteria.region) {
    params.set('region', criteria.region)
  }

  if (criteria.city) {
    params.set('city', criteria.city)
  }

  if (criteria.minPrice) {
    params.set(
      'minPrice',
      criteria.minPrice
    )
  }

  if (criteria.maxPrice) {
    params.set(
      'maxPrice',
      criteria.maxPrice
    )
  }

  if (
    criteria.sort === 'price_asc' ||
    criteria.sort === 'price_desc'
  ) {
    params.set('sort', criteria.sort)
  }

  const query = params.toString()

  return query
    ? `/listings?${query}`
    : '/listings'
}

function formatCriteria(criteria: SearchCriteria | null) {
  if (!criteria) {
    return ['All commercial properties']
  }

  const items: string[] = []

  if (criteria.keyword) {
    items.push(`Keyword: ${criteria.keyword}`)
  }

  if (criteria.transaction === 'SALE') {
    items.push('For Sale')
  } else if (criteria.transaction === 'LEASE') {
    items.push('For Lease')
  } else if (criteria.transaction === 'SUBLEASE') {
    items.push('For Sublease')
  }

  if (criteria.rateBasis === 'ANNUAL') {
    items.push('Annual')
  } else if (criteria.rateBasis === 'MONTHLY') {
    items.push('Monthly')
  } else if (criteria.rateBasis === 'SQFT_YEAR') {
    items.push('Per SF / Year')
  }

  if (criteria.propertyType) {
    items.push(criteria.propertyType)
  }

  if (criteria.city) {
    items.push(criteria.city)
  }

  if (criteria.region) {
    items.push(criteria.region)
  }

  const min = criteria.minPrice
  const max = criteria.maxPrice

  if (min && max) {
    items.push(`$${min}–$${max}`)
  } else if (min) {
    items.push(`From $${min}`)
  } else if (max) {
    items.push(`Up to $${max}`)
  }

  return items.length > 0
    ? items
    : ['All commercial properties']
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function formatFrequency(value: string) {
  if (value === 'DAILY') {
    return 'Daily alerts'
  }

  if (value === 'WEEKLY') {
    return 'Weekly alerts'
  }

  if (value === 'NONE') {
    return 'Alerts off'
  }

  return value
}

export default async function SavedSearchesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: searches, error } =
    await supabase
      .from('saved_searches')
      .select(
        'id, name, search_criteria, notification_frequency, active, created_at'
      )
      .eq('user_id', user.id)
      .order('created_at', {
        ascending: false,
      })

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-5xl">
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
              Saved Searches
            </h1>

            <p className="mt-3 text-gray-600">
              Reopen your commercial property searches
              without rebuilding the filters.
            </p>
          </div>

          <Link
            href="/listings"
            className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            New Search
          </Link>
        </div>

        {error ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-900">
              Saved searches could not be loaded
            </p>

            <p className="mt-2 text-sm text-red-700">
              {error.message}
            </p>
          </div>
        ) : !searches ||
          searches.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center">
            <h2 className="text-2xl font-bold text-gray-950">
              No saved searches yet
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-gray-600">
              Search the marketplace, choose your filters,
              then use Save Search.
            </p>

            <Link
              href="/listings"
              className="mt-6 inline-flex rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Search Properties
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {searches.map((search) => {
              const criteria =
                search.search_criteria as
                  | SearchCriteria
                  | null

              const searchUrl =
                buildSearchUrl(criteria)

              return (
                <article
                  key={search.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-950">
                        {search.name}
                      </h2>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {formatCriteria(criteria).map(
                          (item, index) => (
                            <span
                              key={`${item}-${index}`}
                              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700"
                            >
                              {item}
                            </span>
                          )
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>
                          Saved{' '}
                          {formatDate(
                            search.created_at
                          )}
                        </span>

                        <span>
                          {formatFrequency(
                            search.notification_frequency
                          )}
                        </span>

                        <span>
                          {search.active
                            ? 'Active'
                            : 'Paused'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={searchUrl}
                        className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                      >
                        View Results
                      </Link>

                      <DeleteSavedSearchButton
                        searchId={search.id}
                      />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
