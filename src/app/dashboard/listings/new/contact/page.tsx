'use client'

import {
  mergeLocalListingDraft,
  saveListingWizardDraft,
} from '@/lib/listing-draft'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Suspense,
  useEffect,
  useState,
} from 'react'

type Draft = Record<string, unknown>

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f6f7f9]" />
      }
    >
      <ContactPageContent />
    </Suspense>
  )
}

function ContactPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const [draft, setDraft] = useState<Draft>({})
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('worldwidecre_listing_draft')
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      setDraft(parsed)
      setName(String(parsed.contactName ?? ''))
      setRole(String(parsed.contactRole ?? ''))
      setCompany(String(parsed.company ?? ''))
      setEmail(String(parsed.contactEmail ?? ''))
      setPhone(String(parsed.contactPhone ?? ''))
      setWhatsapp(String(parsed.whatsapp ?? ''))
    } catch {
      setDraft({})
    }
  }, [])

  const canContinue = Boolean(name.trim() && role && email.trim())

  async function continueListing() {
    const nextDraft = mergeLocalListingDraft(
      {
      contactName: name.trim(),
      contactRole: role,
      company: company.trim(),
      contactEmail: email.trim(),
      contactPhone: phone.trim(),
      whatsapp: whatsapp.trim(),
    }
    )

    try {
      await saveListingWizardDraft(
        nextDraft,
        8
      )
    } catch (error) {
      console.error(
        'Online draft save failed. Local draft was preserved:',
        error
      )
    }

    router.push('/dashboard/listings/new/review')
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <header className="bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-lg font-bold text-white">WorldwideCRE</Link>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            Commercial Property Listing
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/dashboard/listings/new/media" className="text-sm font-medium text-slate-600">
          ← Back to Media & Documents
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-8 py-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">Create Listing</p>
            <h1 className="mt-3 text-3xl font-bold">Representative & Contact</h1>
            <p className="mt-3 text-sm text-slate-300">
              Buyers will use this information to contact the person responsible for the listing.
            </p>
          </div>

          <div className="p-8 sm:p-10">
            <Progress />

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Representative name" value={name} onChange={setName} placeholder="Full name" />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Relationship to property</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                >
                  <option value="">Select role</option>
                  <option value="OWNER">Owner</option>
                  <option value="AGENT">Commercial Agent / Realtor</option>
                  <option value="BROKER">Broker</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="BUILDER">Builder</option>
                  <option value="PROPERTY_MANAGER">Property Manager</option>
                  <option value="AUTHORIZED_REPRESENTATIVE">Authorized Representative</option>
                </select>
              </div>

              <Field label="Company / organization" value={company} onChange={setCompany} placeholder="Optional" />
              <Field label="Email" value={email} onChange={setEmail} placeholder="representative@company.com" type="email" />
              <Field label="Phone" value={phone} onChange={setPhone} placeholder="+1 416 555 0123" type="tel" />
              <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="+1 416 555 0123" type="tel" />
            </div>

            <div className="mt-8 rounded-2xl border border-teal-100 bg-teal-50/70 p-5">
              <p className="text-sm font-semibold text-teal-950">Direct customer relationship</p>
              <p className="mt-1 text-sm leading-6 text-teal-800">
                Listing inquiries are intended for the representative. WorldwideCRE facilitates the connection rather than taking ownership of the customer relationship.
              </p>
            </div>

            <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
              <button
                type="button"
                disabled={!canContinue}
                onClick={continueListing}
                className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Review Listing →
              </button>
            </div>
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
        <span className="font-semibold text-slate-700">Representative</span>
        <span className="text-slate-500">Step 7 of 8</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-full w-[87.5%] rounded-full bg-teal-600" />
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
      />
    </div>
  )
}
