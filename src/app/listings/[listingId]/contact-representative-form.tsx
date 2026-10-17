'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ContactRepresentativeForm({
  listingId,
}: {
  listingId: string
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('I’m interested in this property and would like to learn more.')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    const supabase = createClient()
    const { error } = await supabase.rpc('submit_listing_inquiry', {
      p_listing_id: listingId,
      p_requester_name: name,
      p_requester_email: email,
      p_requester_phone: phone || null,
      p_message: message,
    })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message || 'We could not send your inquiry. Please try again.')
      return
    }

    setStatus('success')
  }

  if (status === 'success') {
    return (
      <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="font-semibold">Inquiry sent.</p>
        <p className="mt-1">Your message has been recorded and routed to the listing representative.</p>
      </div>
    )
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-xl bg-gray-950 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
        >
          Send an Inquiry
        </button>
      ) : (
        <form onSubmit={submitInquiry} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="grid gap-3">
            <div>
              <label htmlFor="inquiry-name" className="text-xs font-semibold text-gray-700">Name</label>
              <input
                id="inquiry-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                maxLength={120}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-950"
              />
            </div>

            <div>
              <label htmlFor="inquiry-email" className="text-xs font-semibold text-gray-700">Email</label>
              <input
                id="inquiry-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={320}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-950"
              />
            </div>

            <div>
              <label htmlFor="inquiry-phone" className="text-xs font-semibold text-gray-700">Phone <span className="font-normal text-gray-500">(optional)</span></label>
              <input
                id="inquiry-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={40}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-950"
              />
            </div>

            <div>
              <label htmlFor="inquiry-message" className="text-xs font-semibold text-gray-700">Message</label>
              <textarea
                id="inquiry-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                minLength={10}
                maxLength={4000}
                rows={5}
                className="mt-1 w-full resize-y rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-950"
              />
            </div>
          </div>

          {status === 'error' && (
            <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex-1 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending…' : 'Send Inquiry'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={status === 'sending'}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
            >
              Cancel
            </button>
          </div>

          <p className="mt-3 text-xs leading-5 text-gray-500">
            Your contact details are shared with the listing representative to respond to this inquiry.
          </p>
        </form>
      )}
    </div>
  )
}
