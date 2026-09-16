'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmAvailabilityButton({
  listingId,
}: {
  listingId: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function confirmAvailability() {
    setBusy(true)
    setMessage('')

    const supabase = createClient()

    const { error } = await supabase.rpc(
      'confirm_listing_availability',
      { p_listing_id: listingId }
    )

    if (error) {
      setMessage(error.message)
      setBusy(false)
      return
    }

    setMessage('Availability confirmed')
    setBusy(false)
    router.refresh()
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={confirmAvailability}
        className="text-sm font-semibold text-emerald-700 hover:underline disabled:opacity-50"
      >
        {busy ? 'Confirming...' : 'Confirm Availability'}
      </button>

      {message && (
        <p className="mt-1 text-xs text-gray-600">
          {message}
        </p>
      )}
    </div>
  )
}
