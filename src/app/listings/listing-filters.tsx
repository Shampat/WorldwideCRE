'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Option = {
  id: string
  name: string
}

type CityOption = {
  id: string
  name: string
  regionId: string
}

type Props = {
  propertyTypes: Option[]
  initialKeyword?: string
  regions: Option[]
  cities: CityOption[]
  initialTransaction?: string
  initialPropertyType?: string
  initialRegion?: string
  initialCity?: string
  initialMinPrice?: string
  initialMaxPrice?: string
  initialRateBasis?: string
  initialSort?: string
}

export default function ListingFilters({
  propertyTypes,
  regions,
  cities,
  initialKeyword = '',
  initialTransaction = '',
  initialPropertyType = '',
  initialRegion = '',
  initialCity = '',
  initialMinPrice = '',
  initialMaxPrice = '',
  initialRateBasis = '',
  initialSort = 'newest',
}: Props) {
  const router = useRouter()

  const [keyword, setKeyword] =
    useState(initialKeyword)

  const [transaction, setTransaction] =
    useState(initialTransaction)

  const [propertyType, setPropertyType] =
    useState(initialPropertyType)

  const [region, setRegion] =
    useState(initialRegion)

  const [city, setCity] =
    useState(initialCity)

  const [minPrice, setMinPrice] =
    useState(initialMinPrice)

  const [maxPrice, setMaxPrice] =
    useState(initialMaxPrice)

  const [rateBasis, setRateBasis] =
    useState(initialRateBasis)

  const [sort, setSort] =
    useState(initialSort)

  const [savingSearch, setSavingSearch] =
    useState(false)

  const [saveMessage, setSaveMessage] =
    useState('')

  const isSale = transaction === 'SALE'

  const isLeaseLike =
    transaction === 'LEASE' ||
    transaction === 'SUBLEASE'

  const priceFilterEnabled =
    isSale || (isLeaseLike && Boolean(rateBasis))

  const filteredCities = useMemo(() => {
    if (!region) {
      return cities
    }

    return cities.filter(
      (item) => item.regionId === region
    )
  }, [cities, region])

  function submitSearch() {
    const params = new URLSearchParams()

    if (keyword.trim()) {
      params.set('keyword', keyword.trim())
    }

    if (transaction) {
      params.set('transaction', transaction)
    }

    if (isLeaseLike && rateBasis) {
      params.set('rateBasis', rateBasis)
    }

    if (propertyType) {
      params.set('propertyType', propertyType)
    }

    if (region) {
      params.set('region', region)
    }

    if (city) {
      params.set('city', city)
    }

    if (priceFilterEnabled && minPrice) {
      params.set('minPrice', minPrice)
    }

    if (priceFilterEnabled && maxPrice) {
      params.set('maxPrice', maxPrice)
    }

    if (
      sort === 'price_asc' ||
      sort === 'price_desc'
    ) {
      params.set('sort', sort)
    }

    const query = params.toString()

    router.push(
      query
        ? `/listings?${query}`
        : '/listings'
    )
  }

  async function saveSearch() {
    if (savingSearch) return

    setSavingSearch(true)
    setSaveMessage('')

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const params = new URLSearchParams()

      if (keyword.trim()) {
        params.set('keyword', keyword.trim())
      }

      if (transaction) {
        params.set('transaction', transaction)
      }

      if (isLeaseLike && rateBasis) {
        params.set('rateBasis', rateBasis)
      }

      if (propertyType) {
        params.set('propertyType', propertyType)
      }

      if (region) {
        params.set('region', region)
      }

      if (city) {
        params.set('city', city)
      }

      if (priceFilterEnabled && minPrice) {
        params.set('minPrice', minPrice)
      }

      if (priceFilterEnabled && maxPrice) {
        params.set('maxPrice', maxPrice)
      }

      if (
        sort === 'price_asc' ||
        sort === 'price_desc'
      ) {
        params.set('sort', sort)
      }

      const query = params.toString()

      router.push(
        query
          ? `/auth?next=${encodeURIComponent(
              `/listings?${query}`
            )}`
          : '/auth?next=/listings'
      )

      return
    }

    const regionName =
      regions.find((item) => item.id === region)
        ?.name || ''

    const cityName =
      cities.find((item) => item.id === city)
        ?.name || ''

    const propertyTypeName =
      propertyTypes.find(
        (item) => item.id === propertyType
      )?.name || ''

    const nameParts = [
      keyword.trim(),
      propertyTypeName,
      cityName || regionName,
      transaction === 'SALE'
        ? 'For Sale'
        : transaction === 'LEASE'
          ? 'For Lease'
          : transaction === 'SUBLEASE'
            ? 'For Sublease'
            : '',
    ].filter(Boolean)

    const searchName =
      nameParts.join(' · ') ||
      'All Commercial Properties'

    const searchCriteria = {
      keyword: keyword.trim(),
      transaction,
      propertyType,
      region,
      city,
      minPrice: priceFilterEnabled ? minPrice : '',
      maxPrice: priceFilterEnabled ? maxPrice : '',
      rateBasis: isLeaseLike ? rateBasis : '',
      sort,
    }

    const { error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: user.id,
        name: searchName,
        search_criteria: searchCriteria,
        notification_frequency: 'DAILY',
        active: true,
      })

    if (error) {
      console.error(error)
      setSaveMessage(
        'Could not save this search.'
      )
      setSavingSearch(false)
      return
    }

    setSaveMessage('Search saved')
    setSavingSearch(false)
  }

  function clearFilters() {
    setKeyword('')
    setTransaction('')
    setPropertyType('')
    setRegion('')
    setCity('')
    setMinPrice('')
    setMaxPrice('')
    setRateBasis('')
    setSort('newest')

    router.push('/listings')
  }

  const hasFilters = Boolean(
    keyword.trim() ||
      transaction ||
      propertyType ||
      region ||
      city ||
      minPrice ||
      maxPrice ||
      rateBasis
  )

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5">
        <label
          htmlFor="keyword"
          className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
        >
          Search commercial properties
        </label>

        <input
          id="keyword"
          type="search"
          value={keyword}
          onChange={(event) =>
            setKeyword(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              submitSearch()
            }
          }}
          placeholder="Try: office Brampton, warehouse Toronto, industrial highway"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm outline-none focus:border-gray-950"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <div>
          <label
            htmlFor="transaction"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Listing type
          </label>

          <select
            id="transaction"
            value={transaction}
            onChange={(event) => {
              const value = event.target.value
              setTransaction(value)
              setRateBasis('')
              setMinPrice('')
              setMaxPrice('')

              if (
                sort === 'price_asc' ||
                sort === 'price_desc'
              ) {
                setSort('newest')
              }
            }}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-gray-950"
          >
            <option value="">
              Sale, lease or sublease
            </option>
            <option value="SALE">
              For Sale
            </option>
            <option value="LEASE">
              For Lease
            </option>
            <option value="SUBLEASE">
              For Sublease
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="propertyType"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Property type
          </label>

          <select
            id="propertyType"
            value={propertyType}
            onChange={(event) =>
              setPropertyType(event.target.value)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-gray-950"
          >
            <option value="">
              All property types
            </option>

            {propertyTypes.map((type) => (
              <option
                key={type.id}
                value={type.id}
              >
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="region"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Province / Region
          </label>

          <select
            id="region"
            value={region}
            onChange={(event) => {
              setRegion(event.target.value)
              setCity('')
            }}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-gray-950"
          >
            <option value="">
              All regions
            </option>

            {regions.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="city"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            City
          </label>

          <select
            id="city"
            value={city}
            onChange={(event) =>
              setCity(event.target.value)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-gray-950"
          >
            <option value="">
              All cities
            </option>

            {filteredCities.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {isLeaseLike && (
          <div>
            <label
              htmlFor="rateBasis"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Rate basis
            </label>

            <select
              id="rateBasis"
              value={rateBasis}
              onChange={(event) => {
                setRateBasis(event.target.value)
                setMinPrice('')
                setMaxPrice('')

                if (
                  !event.target.value &&
                  (sort === 'price_asc' ||
                    sort === 'price_desc')
                ) {
                  setSort('newest')
                }
              }}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-gray-950"
            >
              <option value="">
                Choose rate basis
              </option>
              <option value="SQFT_YEAR">
                $ / sq ft / year
              </option>
              <option value="MONTHLY">
                $ / month
              </option>
              <option value="ANNUAL">
                $ / year
              </option>
            </select>
          </div>
        )}

        <div>
          <label
            htmlFor="minPrice"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            {isSale
              ? 'Min price'
              : isLeaseLike
                ? 'Min rate'
                : 'Min price / rate'}
          </label>

          <input
            id="minPrice"
            type="number"
            min="0"
            step={
              rateBasis === 'SQFT_YEAR'
                ? '0.01'
                : '1'
            }
            value={minPrice}
            disabled={!priceFilterEnabled}
            onChange={(event) =>
              setMinPrice(event.target.value)
            }
            placeholder={
              !transaction
                ? 'Select listing type'
                : isLeaseLike && !rateBasis
                  ? 'Choose rate basis'
                  : 'No minimum'
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-gray-950 disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>

        <div>
          <label
            htmlFor="maxPrice"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            {isSale
              ? 'Max price'
              : isLeaseLike
                ? 'Max rate'
                : 'Max price / rate'}
          </label>

          <input
            id="maxPrice"
            type="number"
            min="0"
            step={
              rateBasis === 'SQFT_YEAR'
                ? '0.01'
                : '1'
            }
            value={maxPrice}
            disabled={!priceFilterEnabled}
            onChange={(event) =>
              setMaxPrice(event.target.value)
            }
            placeholder={
              !transaction
                ? 'Select listing type'
                : isLeaseLike && !rateBasis
                  ? 'Choose rate basis'
                  : 'No maximum'
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-gray-950 disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>

        <div>
          <label
            htmlFor="sort"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Sort by
          </label>

          <select
            id="sort"
            value={sort}
            onChange={(event) =>
              setSort(event.target.value)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-gray-950"
          >
            <option value="newest">
              Newest
            </option>
            <option
              value="price_asc"
              disabled={!priceFilterEnabled}
            >
              {isSale
                ? 'Price: Low to High'
                : 'Rate: Low to High'}
            </option>
            <option
              value="price_desc"
              disabled={!priceFilterEnabled}
            >
              {isSale
                ? 'Price: High to Low'
                : 'Rate: High to Low'}
            </option>
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submitSearch}
          className="rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Search properties
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}

        <button
          type="button"
          onClick={saveSearch}
          disabled={savingSearch}
          className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {savingSearch
            ? 'Saving...'
            : '♡ Save Search'}
        </button>

        {saveMessage && (
          <span className="text-sm font-semibold text-gray-600">
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  )
}
