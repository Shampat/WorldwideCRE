'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Listing = {
  id: string
  title: string | null
  next_confirmation_at: string | null
}

export default function BulkConfirmListings({
  listings,
}: {
  listings: Listing[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  async function confirmSelected() {
    if (selected.length === 0) return

    setBusy(true)
    setMessage('')

    const supabase = createClient()

    const { error } = await supabase.rpc(
      'confirm_listing_availability_bulk',
      { p_listing_ids: selected }
    )

    if (error) {
      setMessage(error.message)
      setBusy(false)
      return
    }

    setSelected([])
    setMessage('Availability confirmed')
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-lg font-bold">
        Listings needing confirmation
      </h2>

      <p className="mt-1 text-sm text-gray-600">
        Select listings that are still available.
      </p>

      <div className="mt-5 space-y-3">
        {listings.map((listing) => (
          <label
            key={listing.id}
            className="flex items-center gap-3 rounded-xl bg-white p-4"
          >
            <input
              type="checkbox"
              checked={selected.includes(listing.id)}
              onChange={() => toggle(listing.id)}
            />

            <span className="font-medium">
              {listing.title || 'Untitled Listing'}
            </span>
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={busy || selected.length === 0}
        onClick={confirmSelected}
        className="mt-5 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
      >
        {busy
          ? 'Confirming...'
          : `Confirm Selected (${selected.length})`}
      </button>

      {message && (
        <p className="mt-3 text-sm text-gray-700">
          {message}
        </p>
      )}
    </div>
  )
}
