'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RemoveSavedButton({
  listingId,
}: {
  listingId: string
}) {
  const router = useRouter()

  const [removing, setRemoving] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  async function removeSavedProperty() {
    if (removing) return

    setRemoving(true)
    setErrorMessage('')

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setErrorMessage(
        'Please sign in again.'
      )
      setRemoving(false)
      return
    }

    const { error } = await supabase
      .from('listing_saves')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId)

    if (error) {
      setErrorMessage(
        'Could not remove this saved property.'
      )
      setRemoving(false)
      return
    }

    router.refresh()
  }

  return (
    <div>
      <button
        type="button"
        onClick={removeSavedProperty}
        disabled={removing}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {removing
          ? 'Removing...'
          : 'Remove Saved Property'}
      </button>

      {errorMessage && (
        <p className="mt-2 text-center text-xs font-medium text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
