import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import AIProposalReview from './ai-proposal-review'

export default async function AIListingReviewPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard/listings/new/assistant"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to AI Listing Assistant
        </Link>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 px-8 py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              AI Draft Review
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Review what WorldwideCRE found
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Check the extracted information before it enters your listing
              draft. Missing information stays blank and anything uncertain
              requires your confirmation.
            </p>
          </div>

          <AIProposalReview />
        </div>
      </div>
    </main>
  )
}
