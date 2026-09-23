'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ReviewActions({
  listingId,
}: {
  listingId: string
}) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] =
    useState(false)
  const [error, setError] = useState('')

  async function review(
    decision: 'PASS' | 'REJECTED'
  ) {
    if (
      decision === 'REJECTED' &&
      !reason.trim()
    ) {
      setError(
        'Please enter a reason before rejecting the listing.'
      )
      return
    }

    const confirmed = window.confirm(
      decision === 'PASS'
        ? 'Approve this listing and make it active on the marketplace?'
        : 'Reject this listing?'
    )

    if (!confirmed) return

    setIsSubmitting(true)
    setError('')

    try {
      const supabase = createClient()

      const { error: reviewError } =
        await supabase.rpc(
          'admin_review_listing',
          {
            p_listing_id: listingId,
            p_decision: decision,
            p_reason:
              reason.trim() || null,
          }
        )

      if (reviewError) {
        throw reviewError
      }

      router.push('/dashboard/admin/review')
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to complete the review.'
      )
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-5">
      <label
        htmlFor="review-reason"
        className="block text-sm font-semibold text-gray-900"
      >
        Review notes / rejection reason
      </label>

      <textarea
        id="review-reason"
        value={reason}
        onChange={(event) =>
          setReason(event.target.value)
        }
        rows={4}
        placeholder="Optional for approval. Required for rejection."
        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      />

      {error && (
        <p className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => review('PASS')}
          className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? 'Processing...'
            : 'Approve Listing'}
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => review('REJECTED')}
          className="rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reject Listing
        </button>
      </div>
    </div>
  )
}
