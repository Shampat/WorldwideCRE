'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Props = {
  listingId: string
  userId: string | null
  initialSaved: boolean
}

export default function SaveListingButton({
  listingId,
  userId,
  initialSaved,
}: Props) {
  const [saved, setSaved] =
    useState(initialSaved)

  const [saving, setSaving] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  if (!userId) {
    return (
      <Link
        href="/auth"
        className="mt-5 flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
      >
        ♡ Sign in to save
      </Link>
    )
  }

  async function toggleSaved() {
    if (saving) return

    setSaving(true)
    setErrorMessage('')

    const supabase = createClient()

    if (saved) {
      const { error } = await supabase
        .from('listing_saves')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId)

      if (error) {
        setErrorMessage(
          'Could not remove this saved property.'
        )
        setSaving(false)
        return
      }

      setSaved(false)
    } else {
      const { error } = await supabase
        .from('listing_saves')
        .insert({
          user_id: userId,
          listing_id: listingId,
        })

      if (error) {
        setErrorMessage(
          'Could not save this property.'
        )
        setSaving(false)
        return
      }

      setSaved(true)
    }

    setSaving(false)
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={toggleSaved}
        disabled={saving}
        className={
          saved
            ? 'flex w-full items-center justify-center rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60'
            : 'flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60'
        }
      >
        {saving
          ? 'Saving...'
          : saved
            ? '♥ Saved'
            : '♡ Save Property'}
      </button>

      {errorMessage && (
        <p className="mt-2 text-center text-xs font-medium text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
