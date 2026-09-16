'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { extractDevelopmentListing } from '@/lib/listing-ai-development-extractor'

export default function ListingAssistantInput() {
  const router = useRouter()

  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  function buildDraft() {
    const trimmed = input.trim()

    if (trimmed.length < 20) {
      setError(
        'Please provide a little more information about the property.'
      )
      return
    }

    setError('')

    const extraction =
      extractDevelopmentListing(trimmed)

    const proposal = {
      version: 1,
      originalInput: trimmed,
      extractedAt: new Date().toISOString(),
      extraction,
      userConfirmedFields: [],
    }

    localStorage.setItem(
      'worldwidecre_ai_listing_proposal',
      JSON.stringify(proposal)
    )

    router.push(
      '/dashboard/listings/new/assistant/review'
    )
  }

  return (
    <>
      <section>
        <label
          htmlFor="property-description"
          className="text-sm font-semibold text-slate-900"
        >
          Property information
        </label>

        <p className="mt-1 text-sm text-slate-500">
          Include whatever you know — location, property type,
          sale or lease, size, asking price or rent, features and
          availability.
        </p>

        <textarea
          id="property-description"
          rows={10}
          value={input}
          onChange={(event) => {
            setInput(event.target.value)

            if (error) {
              setError('')
            }
          }}
          placeholder="Example: 2,500 sq ft office for lease in Waterloo, Ontario. Asking $28 per sq ft per year. Recently renovated with private offices, boardroom and parking. Available immediately."
          className="mt-4 w-full resize-y rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm leading-6 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
        />

        {error && (
          <p className="mt-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-950">
          You remain in control
        </p>

        <p className="mt-1 text-sm leading-6 text-amber-800">
          AI suggestions are not published automatically. You will
          review and confirm the listing information before it can
          be submitted to WorldwideCRE.
        </p>
      </section>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-xs leading-5 text-slate-500">
          Do not include confidential information that should not
          appear in the listing.
        </p>

        <button
          type="button"
          onClick={buildDraft}
          disabled={!input.trim()}
          className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Build My Draft →
        </button>
      </div>
    </>
  )
}
