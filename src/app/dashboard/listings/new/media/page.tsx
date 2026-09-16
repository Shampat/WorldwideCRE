'use client'

import {
  mergeLocalListingDraft,
  saveListingWizardDraft,
} from '@/lib/listing-draft'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Suspense, useEffect, useState } from 'react'

type Draft = Record<string, unknown>

type UploadedImage = {
  id: string
  storagePath: string
  fileName: string
  mimeType: string
  fileSize: number
}

type UploadedDocument = {
  id: string
  storagePath: string
  fileName: string
  mimeType: string
  fileSize: number
  documentType: string
}

function readUploadedImages(value: unknown): UploadedImage[] {
  if (!Array.isArray(value)) return []

  return value.filter((item): item is UploadedImage => {
    if (!item || typeof item !== 'object') return false

    const image = item as Record<string, unknown>

    return (
      typeof image.id === 'string' &&
      typeof image.storagePath === 'string' &&
      typeof image.fileName === 'string'
    )
  })
}

function readUploadedDocuments(
  value: unknown
): UploadedDocument[] {
  if (!Array.isArray(value)) return []

  return value.filter(
    (item): item is UploadedDocument => {
      if (!item || typeof item !== 'object') {
        return false
      }

      const document =
        item as Record<string, unknown>

      return (
        typeof document.id === 'string' &&
        typeof document.storagePath ===
          'string' &&
        typeof document.fileName === 'string'
      )
    }
  )
}

export default function MediaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f6f7f9]" />
      }
    >
      <MediaPageContent />
    </Suspense>
  )
}

function MediaPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const [draft, setDraft] = useState<Draft>({})
  const [virtualTour, setVirtualTour] = useState('')
  const [rightsConfirmed, setRightsConfirmed] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocument[]
  >([])

  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(
      'worldwidecre_listing_draft'
    )

    if (!stored) return

    try {
      const parsed = JSON.parse(stored)

      setDraft(parsed)
      setVirtualTour(String(parsed.virtualTour ?? ''))
      setRightsConfirmed(
        Boolean(parsed.imageRightsConfirmed)
      )
      setUploadedImages(
        readUploadedImages(parsed.uploadedImages)
      )
      setUploadedDocuments(
        readUploadedDocuments(
          parsed.uploadedDocuments
        )
      )
    } catch {
      setDraft({})
    }
  }, [])

  async function persistImages(images: UploadedImage[]) {
    const nextDraft = mergeLocalListingDraft({
      uploadedImages: images,
      selectedImageCount: images.length,
    })

    setDraft(nextDraft)

    try {
      await saveListingWizardDraft(nextDraft, 6)
    } catch (error) {
      console.error(
        'Image metadata draft save failed:',
        error
      )
    }
  }

  async function uploadImages(
    files: FileList | null
  ) {
    if (!files || files.length === 0) return

    setUploadError('')

    const remainingSlots = 12 - uploadedImages.length

    if (remainingSlots <= 0) {
      setUploadError(
        'A listing can have a maximum of 12 images.'
      )
      return
    }

    const selected = Array.from(files).slice(
      0,
      remainingSlots
    )

    setIsUploading(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(
          'You must be signed in to upload images.'
        )
      }

      const draftId = localStorage.getItem(
        'worldwidecre_listing_draft_id'
      )

      if (!draftId) {
        throw new Error(
          'The listing draft could not be identified. Please go back one step, save the draft, and return to Media.'
        )
      }

      const uploaded: UploadedImage[] = []

      for (const file of selected) {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
        ]

        if (!allowedTypes.includes(file.type)) {
          throw new Error(
            `${file.name} is not a supported image type.`
          )
        }

        const extension =
          file.name.split('.').pop()?.toLowerCase() ||
          'jpg'

        const storagePath =
          `${user.id}/${draftId}/` +
          `${crypto.randomUUID()}.${extension}`

        const { error: storageError } =
          await supabase.storage
            .from('listing-media')
            .upload(storagePath, file, {
              contentType: file.type,
              upsert: false,
            })

        if (storageError) {
          throw new Error(
            `Upload failed for ${file.name}: ${storageError.message}`
          )
        }

        const { data: asset, error: assetError } =
          await supabase
            .from('media_assets')
            .insert({
              uploaded_by: user.id,
              storage_path: storagePath,
              media_type: 'IMAGE',
              mime_type: file.type,
              file_size: file.size,
            })
            .select(
              'id, storage_path, mime_type, file_size'
            )
            .single()

        if (assetError || !asset) {
          await supabase.storage
            .from('listing-media')
            .remove([storagePath])

          throw new Error(
            `The database record could not be created for ${file.name}: ${
              assetError?.message ??
              'Unknown database error'
            }`
          )
        }

        uploaded.push({
          id: asset.id,
          storagePath: asset.storage_path,
          fileName: file.name,
          mimeType: asset.mime_type ?? file.type,
          fileSize:
            Number(asset.file_size) || file.size,
        })
      }

      const combined = [
        ...uploadedImages,
        ...uploaded,
      ].slice(0, 12)

      setUploadedImages(combined)
      await persistImages(combined)
    } catch (error) {
      console.error('Image upload failed:', error)

      setUploadError(
        error instanceof Error
          ? error.message
          : 'The images could not be uploaded.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  async function removeImage(
    image: UploadedImage
  ) {
    if (isUploading) return

    setUploadError('')

    try {
      const supabase = createClient()

      // Existing published/edit listings may already
      // reference this asset. Remove that relationship
      // before deleting the media asset itself.
      const { error: relationError } =
        await supabase
          .from('listing_media')
          .delete()
          .eq('media_asset_id', image.id)

      if (relationError) {
        throw new Error(
          `The image could not be detached from the listing: ${relationError.message}`
        )
      }

      const { error: assetError } =
        await supabase
          .from('media_assets')
          .delete()
          .eq('id', image.id)

      if (assetError) {
        throw new Error(
          `The image record could not be removed: ${assetError.message}`
        )
      }

      const { error: storageError } =
        await supabase.storage
          .from('listing-media')
          .remove([image.storagePath])

      if (storageError) {
        console.error(
          'Image file cleanup failed:',
          storageError
        )
      }

      const remaining = uploadedImages.filter(
        (item) => item.id !== image.id
      )

      setUploadedImages(remaining)
      await persistImages(remaining)
    } catch (error) {
      console.error(
        'Image removal failed:',
        error
      )

      setUploadError(
        error instanceof Error
          ? error.message
          : 'The image could not be removed.'
      )
    }
  }

  async function persistDocuments(
    documents: UploadedDocument[]
  ) {
    const nextDraft = mergeLocalListingDraft({
      uploadedDocuments: documents,
      selectedDocumentCount:
        documents.length,
    })

    setDraft(nextDraft)

    try {
      await saveListingWizardDraft(
        nextDraft,
        6
      )
    } catch (error) {
      console.error(
        'Document metadata draft save failed:',
        error
      )
    }
  }

  async function uploadDocuments(
    files: FileList | null
  ) {
    if (!files || files.length === 0) {
      return
    }

    setUploadError('')

    const remainingSlots =
      2 - uploadedDocuments.length

    if (remainingSlots <= 0) {
      setUploadError(
        'A listing can have a maximum of 2 documents.'
      )
      return
    }

    const selected = Array.from(files).slice(
      0,
      remainingSlots
    )

    setIsUploading(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(
          'You must be signed in to upload documents.'
        )
      }

      const draftId = localStorage.getItem(
        'worldwidecre_listing_draft_id'
      )

      if (!draftId) {
        throw new Error(
          'The listing draft could not be identified. Please go back one step, save the draft, and return to Media.'
        )
      }

      const uploaded: UploadedDocument[] =
        []

      for (const file of selected) {
        if (file.type !== 'application/pdf') {
          throw new Error(
            `${file.name} is not a PDF file.`
          )
        }

        /*
         * Keep launch uploads lightweight.
         * 15 MB maximum per PDF.
         */
        if (file.size > 15 * 1024 * 1024) {
          throw new Error(
            `${file.name} is larger than the 15 MB limit.`
          )
        }

        const storagePath =
          `${user.id}/${draftId}/` +
          `${crypto.randomUUID()}.pdf`

        const { error: storageError } =
          await supabase.storage
            .from('listing-documents')
            .upload(storagePath, file, {
              contentType: 'application/pdf',
              upsert: false,
            })

        if (storageError) {
          throw new Error(
            `Upload failed for ${file.name}: ${storageError.message}`
          )
        }

        const {
          data: document,
          error: documentError,
        } = await supabase
          .from('documents')
          .insert({
            uploaded_by: user.id,
            storage_path: storagePath,
            file_name: file.name,
            document_type: 'OTHER',
            mime_type: 'application/pdf',
            file_size: file.size,
          })
          .select(
            'id, storage_path, file_name, document_type, mime_type, file_size'
          )
          .single()

        if (documentError || !document) {
          await supabase.storage
            .from('listing-documents')
            .remove([storagePath])

          throw new Error(
            `The database record could not be created for ${file.name}: ${
              documentError?.message ??
              'Unknown database error'
            }`
          )
        }

        uploaded.push({
          id: document.id,
          storagePath:
            document.storage_path,
          fileName: document.file_name,
          mimeType:
            document.mime_type ??
            'application/pdf',
          fileSize:
            Number(document.file_size) ||
            file.size,
          documentType:
            document.document_type ??
            'OTHER',
        })
      }

      const combined = [
        ...uploadedDocuments,
        ...uploaded,
      ].slice(0, 2)

      setUploadedDocuments(combined)
      await persistDocuments(combined)
    } catch (error) {
      console.error(
        'Document upload failed:',
        error
      )

      setUploadError(
        error instanceof Error
          ? error.message
          : 'The document could not be uploaded.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  async function removeDocument(
    document: UploadedDocument
  ) {
    if (isUploading) return

    setUploadError('')

    try {
      const supabase = createClient()

      const { error: storageError } =
        await supabase.storage
          .from('listing-documents')
          .remove([document.storagePath])

      if (storageError) {
        throw storageError
      }

      const { error: documentError } =
        await supabase
          .from('documents')
          .delete()
          .eq('id', document.id)

      if (documentError) {
        throw documentError
      }

      const remaining =
        uploadedDocuments.filter(
          (item) =>
            item.id !== document.id
        )

      setUploadedDocuments(remaining)
      await persistDocuments(remaining)
    } catch (error) {
      console.error(
        'Document removal failed:',
        error
      )

      setUploadError(
        error instanceof Error
          ? error.message
          : 'The document could not be removed.'
      )
    }
  }

  async function continueListing() {
    const nextDraft = mergeLocalListingDraft({
      virtualTour: virtualTour.trim(),
      imageRightsConfirmed: rightsConfirmed,
      uploadedImages,
      selectedImageCount: uploadedImages.length,
      uploadedDocuments,
      selectedDocumentCount:
        uploadedDocuments.length,
    })

    try {
      await saveListingWizardDraft(
        nextDraft,
        7
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
        : '/dashboard/listings/new/contact'
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <header className="bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-lg font-bold text-white"
          >
            WorldwideCRE
          </Link>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            Commercial Property Listing
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/dashboard/listings/new/description"
          className="text-sm font-medium text-slate-600"
        >
          ← Back to Description & AI
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-8 py-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
              Create Listing
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Media & Documents
            </h1>

            <p className="mt-3 text-sm text-slate-300">
              Add property photography, a virtual tour and supporting commercial documents.
            </p>
          </div>

          <div className="p-8 sm:p-10">
            <Progress />

            <section>
              <h2 className="font-semibold text-slate-900">
                Property photos
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Up to 12 images per listing.
              </p>

              <label
                className={`mt-4 flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center ${
                  isUploading ||
                  uploadedImages.length >= 12
                    ? 'cursor-not-allowed border-slate-200 bg-slate-100'
                    : 'cursor-pointer border-slate-300 bg-slate-50 hover:border-teal-500 hover:bg-teal-50/30'
                }`}
              >
                <span className="text-3xl">
                  {isUploading ? '…' : '＋'}
                </span>

                <span className="mt-3 text-sm font-semibold text-slate-800">
                  {isUploading
                    ? 'Uploading images...'
                    : uploadedImages.length >= 12
                      ? 'Maximum 12 images reached'
                      : 'Choose property images'}
                </span>

                <span className="mt-1 text-xs text-slate-500">
                  JPG, PNG or WebP • Maximum 12
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={
                    isUploading ||
                    uploadedImages.length >= 12
                  }
                  className="hidden"
                  onChange={async (e) => {
                    await uploadImages(
                      e.target.files
                    )

                    e.target.value = ''
                  }}
                />
              </label>

              {uploadError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">
                    {uploadError}
                  </p>
                </div>
              )}

              {uploadedImages.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-teal-700">
                    {uploadedImages.length} of 12 images uploaded
                  </p>

                  <div className="mt-3 space-y-2">
                    {uploadedImages.map(
                      (image, index) => (
                        <div
                          key={image.id}
                          className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {index + 1}. {image.fileName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {Math.max(
                                1,
                                Math.round(
                                  image.fileSize / 1024
                                )
                              )}{' '}
                              KB
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() =>
                              removeImage(image)
                            }
                            className="shrink-0 text-sm font-semibold text-red-700 hover:text-red-900 disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="mt-8 border-t border-slate-100 pt-8">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Virtual tour URL
              </label>

              <input
                value={virtualTour}
                onChange={(e) =>
                  setVirtualTour(e.target.value)
                }
                placeholder="Matterport, YouTube, Vimeo or another tour URL"
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
              />
            </section>

            <section className="mt-8 border-t border-slate-100 pt-8">
              <h2 className="font-semibold text-slate-900">
                Commercial documents
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Optional supporting material such as a brochure, floor plan or offering memorandum.
              </p>

              <p className="mt-2 text-xs text-slate-500">
                PDF only • Maximum 2 documents • 15 MB per file
              </p>

              <label
                className={`mt-4 inline-flex rounded-xl border px-5 py-3 text-sm font-semibold ${
                  isUploading ||
                  uploadedDocuments.length >= 2
                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                    : 'cursor-pointer border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isUploading
                  ? 'Uploading...'
                  : uploadedDocuments.length >= 2
                    ? 'Maximum 2 documents reached'
                    : 'Choose PDF documents'}

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  disabled={
                    isUploading ||
                    uploadedDocuments.length >= 2
                  }
                  className="hidden"
                  onChange={async (e) => {
                    await uploadDocuments(
                      e.target.files
                    )

                    e.target.value = ''
                  }}
                />
              </label>

              {uploadedDocuments.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-teal-700">
                    {uploadedDocuments.length} of 2 documents uploaded
                  </p>

                  <div className="mt-3 space-y-2">
                    {uploadedDocuments.map(
                      (document, index) => (
                        <div
                          key={document.id}
                          className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {index + 1}.{' '}
                              {document.fileName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              PDF •{' '}
                              {document.fileSize >=
                              1024 * 1024
                                ? `${(
                                    document.fileSize /
                                    (1024 * 1024)
                                  ).toFixed(1)} MB`
                                : `${Math.max(
                                    1,
                                    Math.round(
                                      document.fileSize /
                                        1024
                                    )
                                  )} KB`}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() =>
                              removeDocument(
                                document
                              )
                            }
                            className="shrink-0 text-sm font-semibold text-red-700 hover:text-red-900 disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </section>

            <label className="mt-8 flex cursor-pointer gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <input
                type="checkbox"
                checked={rightsConfirmed}
                onChange={(e) =>
                  setRightsConfirmed(
                    e.target.checked
                  )
                }
                className="mt-1 h-4 w-4"
              />

              <div>
                <p className="text-sm font-semibold text-amber-950">
                  Image rights confirmation
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  I confirm that I have the right or permission to publish these images on WorldwideCRE.
                </p>
              </div>
            </label>

            <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
              <button
                type="button"
                disabled={
                  !rightsConfirmed ||
                  isUploading
                }
                onClick={continueListing}
                className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Continue →
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
        <span className="font-semibold text-slate-700">
          Media
        </span>

        <span className="text-slate-500">
          Step 6 of 8
        </span>
      </div>

      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-full w-3/4 rounded-full bg-teal-600" />
      </div>
    </div>
  )
}
