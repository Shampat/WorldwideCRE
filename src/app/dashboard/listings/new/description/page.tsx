'use client'

import {
  mergeLocalListingDraft,
  saveListingWizardDraft,
} from '@/lib/listing-draft'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Suspense, useEffect, useState } from 'react'

type Draft = Record<string, unknown>

export default function DescriptionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f6f7f9]" />
      }
    >
      <DescriptionPageContent />
    </Suspense>
  )
}

function DescriptionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const [draft, setDraft] = useState<Draft>({})
  const [description, setDescription] = useState('')
  const [highlights, setHighlights] = useState('')
  const [aiMessage, setAiMessage] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('worldwidecre_listing_draft')
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      setDraft(parsed)
      setDescription(String(parsed.description ?? ''))
      setHighlights(String(parsed.highlights ?? ''))
    } catch {
      setDraft({})
    }
  }, [])

  async function saveAndContinue() {
    const nextDraft = mergeLocalListingDraft(
      {
      description: description.trim(),
      highlights: highlights.trim(),
    }
    )

    try {
      await saveListingWizardDraft(
        nextDraft,
        6
      )
    } catch (error) {
      console.error(
        'Online draft save failed. Local draft was preserved:',
        error
      )
    }

    router.push(
      returnTo === 'review'
        ? '/dashboard/listings/new/review'
        : '/dashboard/listings/new/media'
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <header className="bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-lg font-bold text-white">
            WorldwideCRE
          </Link>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
            Commercial Property Listing
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/dashboard/listings/new/financial" className="text-sm font-medium text-slate-600">
          ← Back to Financial Information
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-8 py-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
              Create Listing
            </p>
            <h1 className="mt-3 text-3xl font-bold">Description & AI</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Describe the opportunity yourself or use AI assistance to help prepare clear commercial listing content.
            </p>
          </div>

          <div className="p-8 sm:p-10">
            <Progress />

            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">AI Listing Assistant</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Future AI will use your confirmed property details to suggest a title, description and highlights.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setAiMessage(
                      'AI generation will be connected after the core listing workflow is complete.'
                    )
                  }
                  className="shrink-0 rounded-xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-800 hover:bg-sky-50"
                >
                  ✦ Generate with AI
                </button>
              </div>

              {aiMessage && (
                <p className="mt-4 rounded-xl bg-white p-3 text-sm text-sky-800">
                  {aiMessage}
                </p>
              )}
            </div>

            <div className="mt-7">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Property description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                placeholder="Describe the property, location advantages, permitted uses, improvements and other important commercial details..."
                className="w-full rounded-xl border border-slate-300 p-4 text-slate-900 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
              />
              <p className="mt-2 text-xs text-slate-500">
                Enter facts you can support. AI should never invent missing property information.
              </p>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Key highlights
              </label>
              <textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                rows={4}
                placeholder="Example: Highway access, 28 ft clear height, four loading doors, ample parking..."
                className="w-full rounded-xl border border-slate-300 p-4 text-slate-900 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
              />
            </div>

            <ContinueButton
              disabled={!description.trim()}
              onClick={saveAndContinue}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

function Progress() {
  return (
    <div className="mb-8">
      <div className="mb-3 flex justify-between text-sm">
        <span className="font-semibold text-slate-700">Listing content</span>
        <span className="font-medium text-slate-500">Step 5 of 8</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-full w-[62.5%] rounded-full bg-teal-600" />
      </div>
    </div>
  )
}

function ContinueButton({
  disabled,
  onClick,
}: {
  disabled: boolean
  onClick: () => void
}) {
  return (
    <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Continue →
      </button>
    </div>
  )
}
