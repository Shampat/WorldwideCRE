import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(value))
}

function statusLabel(status: string) {
  return status.toLowerCase().replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default async function DashboardInquiriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/dashboard/inquiries')

  const { data: inquiries } = await supabase
    .from('listing_inquiries')
    .select('id, listing_id, requester_name, requester_email, requester_phone, message, status, created_at, listings(title)')
    .eq('recipient_user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/dashboard" className="text-xl font-bold text-gray-950">WorldwideCRE</Link>
          <Link href="/dashboard" className="text-sm font-semibold text-gray-600 hover:text-gray-950">← Dashboard</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Leads</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">Property inquiries</h1>
            <p className="mt-2 text-gray-600">Inquiries sent by people interested in your active listings.</p>
          </div>
          <Link href="/dashboard/listings" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800">Manage Listings</Link>
        </div>

        {inquiries && inquiries.length > 0 ? (
          <div className="mt-8 grid gap-5">
            {inquiries.map((inquiry) => {
              const listing = Array.isArray(inquiry.listings) ? inquiry.listings[0] : inquiry.listings
              return (
                <article key={inquiry.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Property inquiry</p>
                      <h2 className="mt-1 text-xl font-bold text-gray-950">{listing?.title || 'Commercial property'}</h2>
                      <p className="mt-1 text-sm text-gray-500">Received {formatDate(inquiry.created_at)}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{statusLabel(inquiry.status)}</span>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
                    <div className="rounded-2xl bg-gray-50 p-4 text-sm">
                      <p className="font-semibold text-gray-950">{inquiry.requester_name}</p>
                      <a href={`mailto:${inquiry.requester_email}`} className="mt-2 block break-all text-gray-700 hover:underline">{inquiry.requester_email}</a>
                      {inquiry.requester_phone && <a href={`tel:${inquiry.requester_phone}`} className="mt-1 block text-gray-700 hover:underline">{inquiry.requester_phone}</a>}
                    </div>
                    <div>
                      <p className="whitespace-pre-line leading-7 text-gray-700">{inquiry.message}</p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <a href={`mailto:${inquiry.requester_email}?subject=Re: ${encodeURIComponent(listing?.title || 'WorldwideCRE property inquiry')}`} className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white">Reply by Email</a>
                        {inquiry.requester_phone && <a href={`tel:${inquiry.requester_phone}`} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800">Call</a>}
                        <Link href={`/listings/${inquiry.listing_id}`} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800">View Listing</Link>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <h2 className="text-xl font-bold text-gray-950">No inquiries yet</h2>
            <p className="mx-auto mt-2 max-w-md text-gray-600">When someone uses Send an Inquiry on one of your active listings, the lead will appear here.</p>
            <Link href="/dashboard/listings" className="mt-5 inline-flex rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white">View My Listings</Link>
          </div>
        )}
      </div>
    </main>
  )
}
