import Link from 'next/link'
import {
  notFound,
  redirect,
} from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditListingLoader from './edit-listing-loader'

export default async function EditListingPage({
  params,
}: {
  params: Promise<{
    listingId: string
  }>
}) {
  const { listingId } = await params

  const supabase =
    await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: listing } =
    await supabase
      .from('listings')
      .select(
        'id, title, status'
      )
      .eq('id', listingId)
      .eq(
        'created_by',
        user.id
      )
      .maybeSingle()

  if (!listing) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/dashboard/listings/${listing.id}`}
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to listing
        </Link>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Edit Listing
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            {listing.title ||
              'Untitled commercial property'}
          </h1>

          <div className="mt-6">
            <EditListingLoader
              listingId={
                listing.id
              }
            />
          </div>
        </div>
      </div>
    </main>
  )
}
