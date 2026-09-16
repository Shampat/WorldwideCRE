'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteSavedSearchButton({
  searchId,
}: {
  searchId: string
}) {
  const router = useRouter()

  const [deleting, setDeleting] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  async function deleteSavedSearch() {
    if (deleting) return

    const confirmed = window.confirm(
      'Delete this saved search?'
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setErrorMessage('')

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setErrorMessage(
        'Please sign in again.'
      )
      setDeleting(false)
      return
    }

    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', searchId)
      .eq('user_id', user.id)

    if (error) {
      setErrorMessage(
        'Could not delete this saved search.'
      )
      setDeleting(false)
      return
    }

    router.refresh()
  }

  return (
    <div>
      <button
        type="button"
        onClick={deleteSavedSearch}
        disabled={deleting}
        className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {deleting
          ? 'Deleting...'
          : 'Delete'}
      </button>

      {errorMessage && (
        <p className="mt-2 text-xs font-medium text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
