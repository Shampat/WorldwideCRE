'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EditListingLoader({
  listingId,
}: {
  listingId: string
}) {
  const router = useRouter()
  const started = useRef(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    if (started.current) return
    started.current = true

    async function startEdit() {
      try {
        const supabase = createClient()

        const {
          data: result,
          error: rpcError,
        } = await supabase.rpc(
          'start_listing_edit',
          {
            p_listing_id: listingId,
          }
        )

        if (rpcError) {
          throw rpcError
        }

        const editResult = Array.isArray(
          result
        )
          ? result[0]
          : result

        const draftId =
          editResult?.draft_id

        if (!draftId) {
          throw new Error(
            'The editing workspace could not be created.'
          )
        }

        const {
          data: draftRow,
          error: draftError,
        } = await supabase
          .from(
            'listing_wizard_drafts'
          )
          .select(
            'id, current_step, draft_data, source_listing_id'
          )
          .eq('id', draftId)
          .single()

        if (draftError || !draftRow) {
          throw (
            draftError ??
            new Error(
              'The editing workspace could not be loaded.'
            )
          )
        }

        localStorage.setItem(
          'worldwidecre_listing_draft_id',
          draftRow.id
        )

        localStorage.setItem(
          'worldwidecre_listing_draft',
          JSON.stringify(
            draftRow.draft_data ?? {}
          )
        )

        router.replace(
          '/dashboard/listings/new/review'
        )
      } catch (error) {
        console.error(
          'Could not start listing edit:',
          error
        )

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'The listing could not be opened for editing.'
        )
      }
    }

    startEdit()
  }, [listingId, router])

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="font-semibold text-red-900">
          Could not open listing editor
        </p>

        <p className="mt-2 text-sm leading-6 text-red-700">
          {errorMessage}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6">
      <p className="font-semibold text-teal-950">
        Opening listing editor...
      </p>

      <p className="mt-2 text-sm text-teal-800">
        Loading the current listing information into your editing workspace.
      </p>
    </div>
  )
}
