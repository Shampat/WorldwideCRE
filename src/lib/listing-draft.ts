import { createClient } from '@/lib/supabase/client'

export const LOCAL_DRAFT_KEY = 'worldwidecre_listing_draft'
export const LOCAL_DRAFT_ID_KEY = 'worldwidecre_listing_draft_id'

export type ListingDraftData = Record<string, unknown>

export function readLocalListingDraft(): ListingDraftData {
  if (typeof window === 'undefined') return {}

  const stored = localStorage.getItem(LOCAL_DRAFT_KEY)

  if (!stored) return {}

  try {
    return JSON.parse(stored)
  } catch {
    return {}
  }
}

export function mergeLocalListingDraft(
  updates: ListingDraftData
): ListingDraftData {
  const existing = readLocalListingDraft()

  const nextDraft = {
    ...existing,
    ...updates,
  }

  localStorage.setItem(
    LOCAL_DRAFT_KEY,
    JSON.stringify(nextDraft)
  )

  return nextDraft
}

export async function saveListingWizardDraft(
  draftData: ListingDraftData,
  currentStep: number
) {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError

  if (!user) {
    return {
      savedOnline: false,
      draftId: null,
    }
  }

  const existingDraftId = localStorage.getItem(
    LOCAL_DRAFT_ID_KEY
  )

  if (existingDraftId) {
    const { data, error } = await supabase
      .from('listing_wizard_drafts')
      .update({
        current_step: currentStep,
        draft_data: draftData,
      })
      .eq('id', existingDraftId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle()

    if (error) throw error

    if (data?.id) {
      return {
        savedOnline: true,
        draftId: data.id,
      }
    }
  }

  const { data, error } = await supabase
    .from('listing_wizard_drafts')
    .insert({
      user_id: user.id,
      current_step: currentStep,
      draft_data: draftData,
    })
    .select('id')
    .single()

  if (error) throw error

  localStorage.setItem(
    LOCAL_DRAFT_ID_KEY,
    data.id
  )

  return {
    savedOnline: true,
    draftId: data.id,
  }
}

export async function restoreLatestListingWizardDraft() {
  if (typeof window === 'undefined') return null

  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError
  if (!user) return null

  const existingDraftId = localStorage.getItem(
    LOCAL_DRAFT_ID_KEY
  )

  if (existingDraftId) {
    const { data, error } = await supabase
      .from('listing_wizard_drafts')
      .select('id, current_step, draft_data')
      .eq('id', existingDraftId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error

    if (data) {
      const draftData = data.draft_data ?? {}

      localStorage.setItem(
        LOCAL_DRAFT_KEY,
        JSON.stringify(draftData)
      )

      return {
        draftId: data.id,
        currentStep: data.current_step,
        draftData,
      }
    }
  }

  const { data, error } = await supabase
    .from('listing_wizard_drafts')
    .select('id, current_step, draft_data')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const draftData = data.draft_data ?? {}

  localStorage.setItem(
    LOCAL_DRAFT_ID_KEY,
    data.id
  )

  localStorage.setItem(
    LOCAL_DRAFT_KEY,
    JSON.stringify(draftData)
  )

  return {
    draftId: data.id,
    currentStep: data.current_step,
    draftData,
  }
}

