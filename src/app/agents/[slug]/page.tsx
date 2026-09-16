import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type AgentRow = {
  profile_id: string
  slug: string
  display_name: string
  title: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  website: string | null
  avatar_url: string | null
  bio: string | null
  listing_id: string | null
  listing_title: string | null
  transaction_type: string | null
  price_amount_minor: number | null
  price_currency: string | null
  price_frequency: string | null
  area_sqm: number | null
}

function formatPrice(row: AgentRow) {
  if (row.price_amount_minor == null) {
    return 'Contact for pricing'
  }

  const amount = row.price_amount_minor / 100

  const formatted = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: row.price_currency || 'CAD',
    maximumFractionDigits: 0,
  }).format(amount)

  if (row.transaction_type === 'SALE') {
    return formatted
  }

  if (row.price_frequency === 'SQFT_YEAR') {
    return `${formatted} / sq ft / year`
  }

  if (row.price_frequency === 'MONTHLY') {
    return `${formatted} / month`
  }

  if (row.price_frequency === 'ANNUAL') {
    return `${formatted} / year`
  }

  return formatted
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'get_public_professional_profile',
    {
      p_slug: slug,
    }
  )

  if (error || !data || data.length === 0) {
    notFound()
  }

  const rows = data as AgentRow[]
  const profile = rows[0]

  const listings = rows.filter(
    (row) => row.listing_id !== null
  )

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/listings"
          className="text-sm font-semibold text-gray-600 hover:text-gray-950"
        >
          ← Browse Commercial Properties
        </Link>

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-8 sm:p-10">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-start">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${profile.display_name} profile`}
                className="h-32 w-32 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-gray-100 text-4xl font-bold text-gray-500">
                {profile.display_name
                  ?.charAt(0)
                  ?.toUpperCase() || '?'}
              </div>
            )}

            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                WorldwideCRE Professional
              </p>

              <h1 className="mt-2 text-4xl font-bold tracking-tight">
                {profile.display_name}
              </h1>

              {profile.title && (
                <p className="mt-2 text-lg text-gray-600">
                  {profile.title}
                </p>
              )}

              {profile.bio && (
                <p className="mt-6 max-w-3xl whitespace-pre-line leading-7 text-gray-700">
                  {profile.bio}
                </p>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Call
                  </a>
                )}

                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold"
                  >
                    Email
                  </a>
                )}

                {profile.whatsapp && (
                  <a
                    href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold"
                  >
                    WhatsApp
                  </a>
                )}

                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold"
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Current Inventory
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Active Listings
              </h2>
            </div>

            <p className="text-sm text-gray-500">
              {listings.length}{' '}
              {listings.length === 1
                ? 'listing'
                : 'listings'}
            </p>
          </div>

          {listings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 text-gray-600">
              No active listings are currently available.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <Link
                  key={listing.listing_id}
                  href={`/listings/${listing.listing_id}`}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                      {listing.transaction_type}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold">
                    {listing.listing_title ||
                      'Commercial Property'}
                  </h3>

                  <p className="mt-4 font-semibold">
                    {formatPrice(listing)}
                  </p>

                  {listing.area_sqm && (
                    <p className="mt-2 text-sm text-gray-500">
                      {Math.round(
                        listing.area_sqm * 10.7639
                      ).toLocaleString('en-CA')}{' '}
                      sq ft
                    </p>
                  )}

                  <p className="mt-6 text-sm font-semibold">
                    View Property →
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
