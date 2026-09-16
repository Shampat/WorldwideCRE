'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  notificationId?: string
  mode: 'single' | 'all'
}

export default function NotificationActions({
  notificationId,
  mode,
}: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function markRead() {
    setSaving(true)
    setError('')

    try {
      const supabase = createClient()

      let query = supabase
        .from('notifications')
        .update({
          read_at: new Date().toISOString(),
        })
        .is('read_at', null)

      if (mode === 'single') {
        if (!notificationId) {
          throw new Error('Notification ID is missing.')
        }

        query = query.eq('id', notificationId)
      }

      const { error: updateError } = await query

      if (updateError) {
        throw updateError
      }

      router.refresh()
    } catch (caught) {
      const message =
        caught &&
        typeof caught === 'object' &&
        'message' in caught
          ? String(caught.message)
          : 'Notification could not be updated.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={markRead}
        disabled={saving}
        className="text-sm font-semibold text-gray-700 hover:text-gray-950 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving
          ? 'Saving...'
          : mode === 'all'
            ? 'Mark all as read'
            : 'Mark as read'}
      </button>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
