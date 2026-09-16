import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ListingAssistantInput from './listing-assistant-input'

export default async function ListingAssistantPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <header className="border-b border-slate-200 bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-white"
          >
            WorldwideCRE
          </Link>

          <span className="rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 text-xs font-medium text-teal-200">
            AI Listing Assistant
          </span>
        </div>
      </header>

      <div className="px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/dashboard/listings/new"
            className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            ← Back to Manual Listing
          </Link>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 px-8 py-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
                AI-assisted listing
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Tell us about the property
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Describe the commercial property in your own words.
                WorldwideCRE will help organize the information into the
                listing form for you to review.
              </p>
            </div>

            <div className="space-y-8 px-8 py-8 sm:px-10 sm:py-10">
              <ListingAssistantInput />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
