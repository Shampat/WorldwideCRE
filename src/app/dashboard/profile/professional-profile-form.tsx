'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  display_name: string | null
  title: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  website: string | null
  bio: string | null
}

export default function ProfessionalProfileForm({
  profile,
}: {
  profile: Profile
}) {
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setMessage('')
    setError('')

    const form = new FormData(event.currentTarget)

    const values = {
      display_name: String(form.get('display_name') || '').trim(),
      title: String(form.get('title') || '').trim() || null,
      email: String(form.get('email') || '').trim() || null,
      phone: String(form.get('phone') || '').trim() || null,
      whatsapp: String(form.get('whatsapp') || '').trim() || null,
      website: String(form.get('website') || '').trim() || null,
      bio: String(form.get('bio') || '').trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (!values.display_name) {
      setError('Display name is required.')
      setSaving(false)
      return
    }

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('contact_profiles')
      .update(values)
      .eq('id', profile.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setMessage('Professional profile updated.')
    setSaving(false)
    router.refresh()
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-gray-500'

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl border border-gray-200 bg-white p-8"
    >
      <h2 className="text-xl font-bold">
        Edit Professional Profile
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Keep your professional contact information accurate and current.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Display name
          <input
            name="display_name"
            required
            defaultValue={profile.display_name || ''}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold">
          Professional title
          <input
            name="title"
            defaultValue={profile.title || ''}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold">
          Email
          <input
            name="email"
            type="email"
            defaultValue={profile.email || ''}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold">
          Phone
          <input
            name="phone"
            defaultValue={profile.phone || ''}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold">
          WhatsApp
          <input
            name="whatsapp"
            defaultValue={profile.whatsapp || ''}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold">
          Website
          <input
            name="website"
            type="url"
            placeholder="https://"
            defaultValue={profile.website || ''}
            className={inputClass}
          />
        </label>
      </div>

      <label className="mt-6 block text-sm font-semibold">
        Professional bio
        <textarea
          name="bio"
          rows={6}
          defaultValue={profile.bio || ''}
          className={inputClass}
          placeholder="Tell clients about your commercial real estate experience and specialties."
        />
      </label>

      {error && (
        <p className="mt-5 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-5 text-sm font-semibold text-green-700">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-6 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  )
}
