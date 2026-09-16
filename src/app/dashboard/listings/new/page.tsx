import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ListingStepOne from './listing-step-one'

export default async function NewListingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const devBypass =
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

  if (!user && !devBypass) {
    redirect('/auth')
  }

  const { data: categories, error: categoryError } = await supabase
    .from('property_categories')
    .select('id, name')
    .eq('active', true)
    .order('sort_order')

  const { data: propertyTypes, error: typeError } = await supabase
    .from('property_types')
    .select('id, category_id, name')
    .eq('active', true)
    .order('sort_order')

  if (categoryError || typeError) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          Unable to load property categories. Please try again.
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <header className="border-b border-slate-200 bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            WorldwideCRE
          </Link>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
            Commercial Property Listing
          </span>
        </div>
      </header>

      <div className="px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 px-8 py-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
                Create Listing
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                What are you listing?
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Start with the transaction and property classification.
                WorldwideCRE will tailor the remaining steps to the property
                you choose.
              </p>
            </div>

            <div className="px-8 py-8 sm:px-10 sm:py-10">
              <ListingStepOne
                categories={categories ?? []}
                propertyTypes={propertyTypes ?? []}
              />
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-slate-500">
            Draft listings are private until submitted for publication.
          </p>
        </div>
      </div>
    </main>
  )
}
