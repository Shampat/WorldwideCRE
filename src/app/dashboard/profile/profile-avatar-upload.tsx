'use client'

import { ChangeEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ProfileAvatarUpload({
  profileId,
}: {
  profileId: string
}) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    setMessage('')
    setError('')

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo must be 5 MB or smaller.')
      return
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Use a JPG, PNG, or WebP image.')
      return
    }

    setUploading(true)

    const supabase = createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('You must be signed in.')
      setUploading(false)
      return
    }

    const extension =
      file.name.split('.').pop()?.toLowerCase() || 'jpg'

    const path =
      `${user.id}/${profileId}/${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('profile-avatars')
      .upload(path, file, {
        contentType: file.type,
      })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('profile-avatars')
      .getPublicUrl(path)

    const { error: updateError } = await supabase
      .from('contact_profiles')
      .update({
        avatar_url: publicUrlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)

    if (updateError) {
      setError(updateError.message)
      setUploading(false)
      return
    }

    setMessage('Profile photo updated.')
    setUploading(false)
    router.refresh()
  }

  return (
    <div className="mt-4">
      <label className="inline-flex cursor-pointer items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50">
        {uploading ? 'Uploading...' : 'Upload Profile Photo'}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={handleUpload}
          className="hidden"
        />
      </label>

      <p className="mt-2 text-xs text-gray-500">
        JPG, PNG or WebP. Maximum 5 MB.
      </p>

      {error && (
        <p className="mt-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-2 text-sm font-semibold text-green-700">
          {message}
        </p>
      )}
    </div>
  )
}
