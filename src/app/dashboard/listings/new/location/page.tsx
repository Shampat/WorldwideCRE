'use client'

import {
  mergeLocalListingDraft,
  saveListingWizardDraft,
} from '@/lib/listing-draft'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Suspense, useEffect, useState } from 'react'

export default function ListingLocationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f6f7f9]" />
      }
    >
      <ListingLocationPageContent />
    </Suspense>
  )
}

function ListingLocationPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const [country, setCountry] = useState('Canada')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [locationPrivacy, setLocationPrivacy] = useState('EXACT')

  useEffect(() => {
    const stored = localStorage.getItem(
      'worldwidecre_listing_draft'
    )

    if (!stored) return

    try {
      const parsed = JSON.parse(stored)

      setCountry(parsed.country ?? 'Canada')
      setProvince(parsed.province ?? '')
      setCity(parsed.city ?? '')
      setAddress(parsed.address ?? '')
      setPostalCode(parsed.postalCode ?? '')
      setLocationPrivacy(
        parsed.locationPrivacy ?? 'EXACT'
      )
    } catch {
      // Keep the default empty values if the local draft is invalid.
    }
  }, [])

  const canContinue = Boolean(country && province.trim() && city.trim())

  async function continueListing() {
    const nextDraft = mergeLocalListingDraft(
      {
      country,
      province: province.trim(),
      city: city.trim(),
      address: address.trim(),
      postalCode: postalCode.trim(),
      locationPrivacy,
    }
    )

    try {
      await saveListingWizardDraft(
        nextDraft,
        3
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
        : '/dashboard/listings/new/details'
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
            href="/dashboard/listings/new"
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            ← Back to Step 1
          </Link>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 px-8 py-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
                Create Listing
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Property & Location
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Tell us where the property is located and how precisely you want
                that location shown publicly.
              </p>
            </div>

            <div className="px-8 py-8 sm:px-10 sm:py-10">
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Property location
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    Step 2 of 8
                  </p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-1/4 rounded-full bg-teal-600" />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Country
                  </label>

                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                  >
                    <option>Canada</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Province / State
                  </label>

                  <input
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Ontario"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    City
                  </label>

                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mississauga"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Postal code
                  </label>

                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="L5B 1M5"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Street address
                </label>

                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Optional for confidential listings"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                />
              </div>

              <section className="mt-8 border-t border-slate-100 pt-8">
                <h2 className="text-base font-semibold text-slate-900">
                  Public location privacy
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  You control how much location information buyers see.
                </p>

                <div className="mt-5 grid gap-3">
                  {[
                    ['EXACT', 'Exact Location', 'Show the exact property location.'],
                    [
                      'APPROXIMATE',
                      'Approximate Location',
                      'Show the general area while protecting the exact location.',
                    ],
                    [
                      'CONFIDENTIAL',
                      'Confidential Location',
                      'Show only city or market area. Contact the representative for details.',
                    ],
                  ].map(([value, title, description]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLocationPrivacy(value)}
                      className={`rounded-xl border p-4 text-left transition ${
                        locationPrivacy === value
                          ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {title}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {description}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              {locationPrivacy !== 'EXACT' && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-amber-900">
                    Location protection enabled
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    WorldwideCRE will avoid displaying the exact public location
                    according to the privacy level you selected.
                  </p>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                <p className="text-xs text-slate-500">
                  Your progress is being kept locally during development.
                </p>

                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={continueListing}
                  className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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
