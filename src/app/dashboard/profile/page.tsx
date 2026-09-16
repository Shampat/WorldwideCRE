import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfessionalProfileForm from './professional-profile-form'
import ProfileAvatarUpload from './profile-avatar-upload'

export default async function ProfessionalProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: profile, error } = await supabase
    .from('contact_profiles')
    .select(`
      id,
      display_name,
      title,
      email,
      phone,
      whatsapp,
      website,
      avatar_url,
      bio,
      organization_id,
      is_primary,
      slug
    `)
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-gray-600 hover:text-gray-950"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Professional Presence
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Professional Profile
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Manage the professional information associated with your
            WorldwideCRE presence and listings.
          </p>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            {error.message}
          </div>
        ) : !profile ? (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8">
            No primary professional profile was found.
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`${profile.display_name || 'Professional'} profile`}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-3xl font-bold text-gray-500">
                    {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}

                <ProfileAvatarUpload
                  profileId={profile.id}
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  {profile.display_name}
                </h2>

                {profile.title && (
                  <p className="mt-1 text-gray-600">
                    {profile.title}
                  </p>
                )}

                <div className="mt-5 space-y-2 text-sm text-gray-700">
                  {profile.email && <p>Email: {profile.email}</p>}
                  {profile.phone && <p>Phone: {profile.phone}</p>}
                  {profile.whatsapp && (
                    <p>WhatsApp: {profile.whatsapp}</p>
                  )}
                  {profile.website && (
                    <p>Website: {profile.website}</p>
                  )}
                </div>

                {profile.bio && (
                  <p className="mt-6 max-w-2xl whitespace-pre-line text-gray-600">
                    {profile.bio}
                  </p>
                )}

                {profile.slug && (
                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Your WorldwideCRE Profile
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      worldwidecre.com/agents/{profile.slug}
                    </p>

                    <Link
                      href={`/agents/${profile.slug}`}
                      className="mt-3 inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                      View Public Profile →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!error && profile && (
          <ProfessionalProfileForm profile={profile} />
        )}
      </div>
    </main>
  )
}
