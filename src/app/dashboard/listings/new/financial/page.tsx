'use client'

import {
  mergeLocalListingDraft,
  saveListingWizardDraft,
} from '@/lib/listing-draft'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Suspense, useEffect, useState } from 'react'

type Draft = {
  transactionType?: string
  categoryName?: string
  propertyTypeName?: string
  [key: string]: unknown
}

export default function FinancialPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f6f7f9]" />
      }
    >
      <FinancialPageContent />
    </Suspense>
  )
}

function FinancialPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const [draft, setDraft] = useState<Draft>({})
  const [salePrice, setSalePrice] = useState('')
  const [leaseRate, setLeaseRate] = useState('')
  const [leaseFrequency, setLeaseFrequency] = useState('MONTHLY')
  const [propertyTaxes, setPropertyTaxes] = useState('')
  const [noi, setNoi] = useState('')
  const [capRate, setCapRate] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('worldwidecre_listing_draft')

    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      setDraft(parsed)

      setSalePrice(parsed.salePrice ?? '')
      setLeaseRate(parsed.leaseRate ?? '')
      setLeaseFrequency(
        parsed.leaseFrequency ??
        parsed.leaseRateBasis ??
        'MONTHLY'
      )
      setPropertyTaxes(parsed.propertyTaxes ?? '')
      setNoi(parsed.noi ?? '')
      setCapRate(parsed.capRate ?? '')
    } catch {
      setDraft({})
    }
  }, [])

  const transactionType = draft.transactionType ?? 'SALE'

  const showSale =
    transactionType === 'SALE'

  const showLease =
    transactionType === 'LEASE' ||
    transactionType === 'SUBLEASE'

  const category = String(draft.categoryName ?? '').toLowerCase()

  const showInvestment =
    category.includes('investment') ||
    category.includes('hospitality')

  const canContinue =
    (showSale && salePrice.trim() !== '') ||
    (showLease && leaseRate.trim() !== '')

  async function continueListing() {
    const nextDraft = mergeLocalListingDraft(
      {
      salePrice,
      leaseRate,
      leaseFrequency,
      propertyTaxes,
      noi,
      capRate,
      currency: 'CAD',
    }
    )

    try {
      await saveListingWizardDraft(
        nextDraft,
        5
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
        : '/dashboard/listings/new/description'
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
            href="/dashboard/listings/new/details"
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            ← Back to Property Details
          </Link>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-8 py-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
                Create Listing
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Financial Information
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Enter the asking price or lease rate buyers should see.
                Additional commercial financial information can be added where relevant.
              </p>
            </div>

            <div className="px-8 py-8 sm:px-10 sm:py-10">
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Pricing
                  </p>

                  <p className="text-sm font-medium text-slate-500">
                    Step 4 of 8
                  </p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-1/2 rounded-full bg-teal-600" />
                </div>
              </div>

              <div className="mb-7 flex flex-wrap gap-2">
                <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">
                  {transactionType === 'SALE'
                    ? 'For Sale'
                    : transactionType === 'LEASE'
                    ? 'For Lease'
                    : 'For Sublease'}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  CAD
                </span>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {showSale && (
                  <MoneyField
                    label="Asking sale price"
                    value={salePrice}
                    onChange={setSalePrice}
                    placeholder="2500000"
                  />
                )}

                {showLease && (
                  <MoneyField
                    label="Asking lease rate"
                    value={leaseRate}
                    onChange={setLeaseRate}
                    placeholder="15000"
                  />
                )}

                {showLease && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Lease rate frequency
                    </label>

                    <select
                      value={leaseFrequency}
                      onChange={(e) => setLeaseFrequency(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                    >
                      <option value="MONTHLY">Per month</option>
                      <option value="ANNUAL">Per year</option>
                      <option value="SQFT_YEAR">Per sq ft / year</option>
                      <option value="SQFT_MONTH">Per sq ft / month</option>
                      <option value="CONTACT">Contact for rate</option>
                    </select>
                  </div>
                )}

                <MoneyField
                  label="Annual property taxes"
                  value={propertyTaxes}
                  onChange={setPropertyTaxes}
                  placeholder="Optional"
                  required={false}
                />
              </div>

              {showInvestment && (
                <section className="mt-8 border-t border-slate-100 pt-8">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Investment information
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Optional information for income-producing commercial properties.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <MoneyField
                      label="Annual NOI"
                      value={noi}
                      onChange={setNoi}
                      placeholder="Optional"
                      required={false}
                    />

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Cap rate
                      </label>

                      <div className="relative">
                        <input
                          value={capRate}
                          onChange={(e) => setCapRate(e.target.value)}
                          inputMode="decimal"
                          placeholder="5.75"
                          className="w-full rounded-xl border border-slate-300 px-4 py-3.5 pr-12 text-slate-900 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                        />

                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50/70 p-5">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-sky-700 shadow-sm">
                    AI
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Pricing insights will come later
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      WorldwideCRE can eventually compare similar commercial
                      listings and market signals, but AI pricing guidance will
                      never silently replace your asking price.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Prices are shown in Canadian dollars
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Currency will become country-specific as WorldwideCRE expands.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={continueListing}
                  className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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

function MoneyField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
          $
        </span>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-300 py-3.5 pl-9 pr-16 text-slate-900 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
          CAD
        </span>
      </div>
    </div>
  )
}
