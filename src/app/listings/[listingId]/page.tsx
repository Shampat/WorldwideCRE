import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SaveListingButton from './save-listing-button'
import ContactRepresentativeForm from './contact-representative-form'

function formatTransactionType(type: string | null) {
  if (type === 'SALE') return 'For Sale'
  if (type === 'LEASE') return 'For Lease'
  if (type === 'SUBLEASE') return 'For Sublease'
  return 'Commercial'
}

function formatMoney(amountMinor: number | null, currency: string | null, frequency: string | null) {
  if (amountMinor === null) return 'Contact for pricing'
  const formatted = new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: currency || 'CAD', maximumFractionDigits: 0,
  }).format(amountMinor / 100)
  const frequencyLabel = frequency === 'MONTHLY' ? '/ month'
    : frequency === 'ANNUALLY' ? '/ year'
    : frequency === 'SQFT_YEAR' ? '/ sq ft / year'
    : frequency === 'SQFT_MONTH' ? '/ sq ft / month' : ''
  return `${formatted} ${frequencyLabel}`.trim()
}

function formatArea(areaSqm: number | null) {
  if (!areaSqm) return null
  return `${new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 }).format(Number(areaSqm) * 10.7639)} sq ft`
}

function formatLocation(city: string | null, region: string | null, country: string | null) {
  return [city, region, country].filter(Boolean).join(', ')
}

function formatFreshness(lastConfirmedAt: string | null) {
  if (!lastConfirmedAt) return null
  const confirmed = new Date(lastConfirmedAt)
  if (Number.isNaN(confirmed.getTime())) return null
  const days = Math.max(0, Math.floor((Date.now() - confirmed.getTime()) / (1000 * 60 * 60 * 24)))
  if (days === 0) return 'Confirmed today'
  if (days === 1) return 'Confirmed yesterday'
  if (days < 7) return `Confirmed ${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return 'Confirmed 1 week ago'
  if (days < 30) return `Confirmed ${weeks} weeks ago`
  return 'Availability confirmation due'
}

type PublicMarketplaceMedia = {
  listing_id: string
  storage_path: string | null
  sort_order: number | null
  media_role: string | null
}

export default async function PublicListingPage({
  params,
}: {
  params: Promise<{ listingId: string }>
}) {
  const { listingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: listing } = await supabase
    .from('public_marketplace_listings')
    .select('*')
    .eq('listing_id', listingId)
    .maybeSingle()

  if (!listing) notFound()

  const { data: representativeRows } = await supabase.rpc('get_public_listing_representative', {
    p_listing_id: listingId,
  })
  const representative = representativeRows?.[0] ?? null

  let initialSaved = false
  if (user) {
    const { data: savedListing } = await supabase
      .from('listing_saves')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .maybeSingle()
    initialSaved = Boolean(savedListing)
  }

  const { data: mediaRows } = await supabase.rpc('get_public_marketplace_media')
  const listingMedia = (mediaRows as PublicMarketplaceMedia[] | null)?.filter((media) => media.listing_id === listingId) ?? []
  const signedResults = await Promise.all(listingMedia.map(async (media) => {
    if (!media.storage_path) return null
    const { data, error } = await supabase.storage.from('listing-media').createSignedUrl(media.storage_path, 60 * 60)
    if (error || !data?.signedUrl) return null
    return { url: data.signedUrl, sortOrder: media.sort_order ?? 0 }
  }))
  const galleryImages = signedResults.filter((image): image is { url: string; sortOrder: number } => image !== null).sort((a, b) => a.sortOrder - b.sortOrder)

  const location = formatLocation(listing.city_name, listing.region_name, listing.country_name)
  const area = formatArea(listing.area_sqm)
  const lotArea = formatArea(listing.lot_area_sqm)
  const freshness = formatFreshness(listing.last_confirmed_at)
  const exactAddress = listing.location_privacy === 'EXACT'
    ? [listing.address_line_1, listing.address_line_2, listing.city_name, listing.region_name, listing.postal_code].filter(Boolean).join(', ')
    : null
  const whatsappNumber = representative?.whatsapp?.replace(/[^0-9]/g, '') ?? ''

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold text-gray-950">WorldwideCRE</Link>
          <div className="flex items-center gap-5">
            <Link href="/listings" className="text-sm font-medium text-gray-600 hover:text-gray-950">Browse Properties</Link>
            <Link href={user ? '/dashboard' : '/auth'} className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white">
              {user ? 'Dashboard' : 'Sign In'}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Link href="/listings" className="text-sm font-semibold text-gray-600 hover:text-gray-950">← Back to listings</Link>

        {galleryImages.length > 0 ? (
          <div className="mt-6 grid overflow-hidden rounded-3xl bg-gray-200 md:grid-cols-2">
            <div className="h-80 md:h-[480px]">
              <img src={galleryImages[0].url} alt={listing.title || 'Commercial property'} className="h-full w-full object-cover" />
            </div>
            {galleryImages.length > 1 && (
              <div className="hidden grid-cols-2 gap-1 md:grid">
                {galleryImages.slice(1, 5).map((image, index) => (
                  <img key={`${image.url}-${index}`} src={image.url} alt="Commercial property" className="h-full min-h-0 w-full object-cover" />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 flex h-80 items-center justify-center rounded-3xl bg-gray-200">
            <div className="text-center"><p className="font-semibold text-gray-600">WorldwideCRE</p><p className="mt-1 text-sm text-gray-500">No property images available</p></div>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-950 px-3 py-1 text-xs font-semibold text-white">{formatTransactionType(listing.transaction_type)}</span>
              {listing.property_type_name && <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">{listing.property_type_name}</span>}
              {listing.is_featured && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Featured</span>}
              {freshness && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{freshness}</span>}
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-950">{listing.title || 'Commercial Property'}</h1>
            <p className="mt-3 text-lg text-gray-600">{exactAddress || location || 'Location available on request'}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Price</p><p className="mt-2 font-bold text-gray-950">{formatMoney(listing.price_amount_minor, listing.price_currency, listing.price_frequency)}</p></div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Building Area</p><p className="mt-2 font-bold text-gray-950">{area || 'Not specified'}</p></div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lot Area</p><p className="mt-2 font-bold text-gray-950">{lotArea || 'Not specified'}</p></div>
            </div>

            {listing.description && (
              <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-7">
                <h2 className="text-2xl font-bold text-gray-950">Property Description</h2>
                <p className="mt-4 whitespace-pre-line leading-7 text-gray-700">{listing.description}</p>
              </div>
            )}

            <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-7">
              <h2 className="text-2xl font-bold text-gray-950">Location</h2>
              <p className="mt-3 text-gray-700">{location || 'Location available on request'}</p>
              {listing.location_privacy === 'APPROXIMATE' && <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">This location is intentionally approximate for privacy and security.</div>}
              {listing.location_privacy === 'CONFIDENTIAL' && <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">Contact representative only. Do not visit the property without permission.</div>}
            </div>
          </section>

          <aside>
            <div className="sticky top-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-500">Listing price</p>
              <p className="mt-2 text-2xl font-bold text-gray-950">{formatMoney(listing.price_amount_minor, listing.price_currency, listing.price_frequency)}</p>

              <SaveListingButton listingId={listingId} userId={user?.id ?? null} initialSaved={initialSaved} />

              <div className="mt-6 border-t border-gray-100 pt-6">
                <h2 className="text-lg font-bold text-gray-950">Contact Representative</h2>
                {representative ? (
                  <div className="mt-4">
                    <div className="flex items-center gap-4">
                      {representative.avatar_url ? (
                        <img src={representative.avatar_url} alt={`${representative.display_name || 'Listing Representative'} profile`} className="h-16 w-16 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-500">{representative.display_name?.charAt(0)?.toUpperCase() || '?'}</div>
                      )}
                      <div>
                        {representative.slug ? <Link href={`/agents/${representative.slug}`} className="font-semibold text-gray-950 hover:underline">{representative.display_name || 'Listing Representative'}</Link> : <p className="font-semibold text-gray-950">{representative.display_name || 'Listing Representative'}</p>}
                        {representative.title && <p className="mt-1 text-sm text-gray-600">{representative.title}</p>}
                        {representative.slug && <Link href={`/agents/${representative.slug}`} className="mt-2 inline-block text-sm font-semibold text-gray-700 hover:text-gray-950 hover:underline">View Professional Profile →</Link>}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {representative.phone && <a href={`tel:${representative.phone}`} className="rounded-xl bg-gray-950 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800">Call Representative</a>}
                      {representative.email && <a href={`mailto:${representative.email}`} className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50">Email Representative</a>}
                      {whatsappNumber && <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50">WhatsApp</a>}
                    </div>

                    <ContactRepresentativeForm listingId={listingId} />
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-gray-600">Representative contact information is not currently available.</p>
                )}
              </div>

              <p className="mt-6 text-xs leading-5 text-gray-500">WorldwideCRE facilitates connections between property seekers and listing representatives.</p>
            </div>
          </aside>
        </div>
      </div>

      <footer className="mt-12 border-t border-gray-200 bg-white px-6 py-8"><div className="mx-auto max-w-7xl text-sm text-gray-500">© 2026 WorldwideCRE</div></footer>
    </main>
  )
}
