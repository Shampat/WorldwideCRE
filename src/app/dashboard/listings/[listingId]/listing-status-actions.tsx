'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ListingStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'ACTIVE'
  | 'PENDING'
  | 'SOLD'
  | 'LEASED'
  | 'WITHDRAWN'
  | 'EXPIRED'
  | 'FLAGGED'
  | 'SUSPENDED'
  | 'REJECTED'

type TransactionType =
  | 'SALE'
  | 'LEASE'
  | 'SUBLEASE'

type Props = {
  listingId: string
  status: ListingStatus
  transactionType: TransactionType
}

type ActionStatus =
  | 'PENDING'
  | 'SOLD'
  | 'LEASED'
  | 'WITHDRAWN'

export default function ListingStatusActions({
  listingId,
  status,
  transactionType,
}: Props) {
  const router = useRouter()

  const [selectedStatus, setSelectedStatus] =
    useState<ActionStatus | null>(null)

  const [reason, setReason] = useState('')
  const [acknowledged, setAcknowledged] =
    useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const terminalAction =
    selectedStatus === 'SOLD' ||
    selectedStatus === 'LEASED' ||
    selectedStatus === 'WITHDRAWN'

  function openAction(nextStatus: ActionStatus) {
    setSelectedStatus(nextStatus)
    setReason('')
    setAcknowledged(false)
    setError('')
  }

  function closeAction() {
    if (isSaving) return

    setSelectedStatus(null)
    setReason('')
    setAcknowledged(false)
    setError('')
  }

  async function confirmAction() {
    if (!selectedStatus) return

    if (terminalAction && !reason.trim()) {
      setError('Please provide a reason before continuing.')
      return
    }

    if (terminalAction && !acknowledged) {
      setError(
        'Please confirm that you understand this listing will leave the active marketplace.'
      )
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const supabase = createClient()

      const { error: rpcError } = await supabase.rpc(
        'change_listing_status',
        {
          p_listing_id: listingId,
          p_new_status: selectedStatus,
          p_reason: reason.trim() || null,
        }
      )

      if (rpcError) {
        throw rpcError
      }

      setSelectedStatus(null)
      router.refresh()
    } catch (caught) {
      const rpcError =
        caught &&
        typeof caught === 'object'
          ? (caught as {
              message?: string
              details?: string
              hint?: string
            })
          : null

      setError(
        rpcError?.message ||
          rpcError?.details ||
          'The listing status could not be changed.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const canMarkPending = status === 'ACTIVE'

  const canComplete =
    status === 'ACTIVE' ||
    status === 'PENDING'

  const canWithdraw =
    status === 'ACTIVE' ||
    status === 'PENDING' ||
    status === 'UNDER_REVIEW'

  if (
    !canMarkPending &&
    !canComplete &&
    !canWithdraw
  ) {
    return null
  }

  const completionStatus: ActionStatus =
    transactionType === 'SALE'
      ? 'SOLD'
      : 'LEASED'

  const completionLabel =
    transactionType === 'SALE'
      ? 'Mark Sold'
      : 'Mark Leased'

  const selectedLabel =
    selectedStatus === 'PENDING'
      ? 'Mark Pending'
      : selectedStatus === 'SOLD'
        ? 'Mark Sold'
        : selectedStatus === 'LEASED'
          ? 'Mark Leased'
          : 'Withdraw Listing'

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2">
        {canMarkPending && (
          <button
            type="button"
            onClick={() => openAction('PENDING')}
            className="inline-flex rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Mark Pending
          </button>
        )}

        {canComplete && (
          <button
            type="button"
            onClick={() =>
              openAction(completionStatus)
            }
            className="inline-flex rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            {completionLabel}
          </button>
        )}

        {canWithdraw && (
          <button
            type="button"
            onClick={() => openAction('WITHDRAWN')}
            className="inline-flex rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Withdraw
          </button>
        )}
      </div>

      {selectedStatus && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="text-base font-semibold text-gray-950">
            {selectedLabel}
          </h3>

          {terminalAction ? (
            <>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                This listing will leave the active marketplace.
                Removing a listing does not automatically qualify
                it for a refund.
              </p>

              <label className="mt-4 block">
                <span className="text-sm font-semibold text-gray-800">
                  Reason
                </span>

                <textarea
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value)
                  }
                  rows={3}
                  placeholder="Briefly explain why this listing is being removed."
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-slate-500"
                />
              </label>

              <label className="mt-4 flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) =>
                    setAcknowledged(
                      event.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4"
                />

                <span>
                  I understand that this action intentionally
                  removes the listing from the active marketplace.
                </span>
              </label>
            </>
          ) : (
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Marking this listing Pending indicates that a
              transaction is in progress while preserving the
              listing record.
            </p>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={confirmAction}
              disabled={isSaving}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? 'Saving...'
                : `Confirm ${selectedLabel}`}
            </button>

            <button
              type="button"
              onClick={closeAction}
              disabled={isSaving}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
