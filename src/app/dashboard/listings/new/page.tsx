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
              <div className="mb-8 rounded-2xl border border-teal-200 bg-teal-50/70 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-teal-700 px-2.5 py-1 text-xs font-bold text-white">
                        AI
                      </span>

                      <h2 className="font-semibold text-slate-950">
                        Start with the AI Listing Assistant
                      </h2>
                    </div>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                      Describe the property in your own words and let
                      WorldwideCRE organize the information into a draft
                      for you to review.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/listings/new/assistant"
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                  >
                    Start with AI →
                  </Link>
                </div>
              </div>

              <div className="mb-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Or enter manually
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

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
