import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ListingStatusActions from './listing-status-actions'

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatTransactionType(type: string) {
  if (type === 'SALE') return 'For Sale'
  if (type === 'LEASE') return 'For Lease'
  if (type === 'SUBLEASE') return 'For Sublease'
  return type
}

function formatMoney(
  amountMinor: number | null,
  currency: string | null
) {
  if (amountMinor === null) return 'Not specified'

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency || 'CAD',
    maximumFractionDigits: 2,
  }).format(amountMinor / 100)
}

function formatArea(areaSqm: number | null) {
  if (areaSqm === null) return 'Not specified'

  const sqft = Number(areaSqm) / 0.09290304

  return `${new Intl.NumberFormat('en-CA', {
    maximumFractionDigits: 0,
  }).format(sqft)} sq ft`
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ listingId: string }>
}) {
  const { listingId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: listing } = await supabase
    .from('listings')
    .select(
      `
      id,
      property_id,
      title,
      description,
      transaction_type,
      status,
      price_amount_minor,
      price_currency,
      price_frequency,
      area_sqm,
      lot_area_sqm,
      location_privacy,
      details,
      created_at,
      updated_at
      `
    )
    .eq('id', listingId)
    .eq('created_by', user.id)
    .maybeSingle()

  if (!listing) {
    notFound()
  }

  const { data: property } = await supabase
    .from('properties')
    .select(
      `
      address_line_1,
      address_line_2,
      postal_code,
      country_id,
      region_id,
      city_id,
      property_type_id
      `
    )
    .eq('id', listing.property_id)
    .maybeSingle()

  let regionName: string | null = null
  let cityName: string | null = null

  if (property?.region_id) {
    const { data: region } = await supabase
      .from('regions')
      .select('name')
      .eq('id', property.region_id)
      .maybeSingle()

    regionName = region?.name ?? null
  }

  if (property?.city_id) {
    const { data: city } = await supabase
      .from('cities')
      .select('name')
      .eq('id', property.city_id)
      .maybeSingle()

    cityName = city?.name ?? null
  }

  const { data: representative } = await supabase
    .from('listing_representatives')
    .select(
      `
      role,
      is_primary,
      contact_profile_id
      `
    )
    .eq('listing_id', listing.id)
    .eq('is_primary', true)
    .maybeSingle()

  let contact: {
    display_name: string
    title: string | null
    email: string | null
    phone: string | null
    whatsapp: string | null
  } | null = null

  if (representative?.contact_profile_id) {
    const { data } = await supabase
      .from('contact_profiles')
      .select(
        'display_name, title, email, phone, whatsapp'
      )
      .eq('id', representative.contact_profile_id)
      .maybeSingle()

    contact = data
  }

  const { data: listingMedia } = await supabase
    .from('listing_media')
    .select('media_asset_id, sort_order')
    .eq('listing_id', listing.id)
    .order('sort_order', {
      ascending: true,
    })

  const mediaAssetIds =
    listingMedia?.map(
      (item) => item.media_asset_id
    ) ?? []

  let galleryImages: {
    id: string
    signedUrl: string
    mimeType: string | null
    sortOrder: number
  }[] = []

  if (mediaAssetIds.length > 0) {
    const { data: mediaAssets } = await supabase
      .from('media_assets')
      .select(
        'id, storage_path, mime_type'
      )
      .in('id', mediaAssetIds)

    if (mediaAssets) {
      const mediaById = new Map(
        mediaAssets.map((asset) => [
          asset.id,
          asset,
        ])
      )

      const signedResults =
        await Promise.all(
          (listingMedia ?? []).map(
            async (item) => {
              const asset = mediaById.get(
                item.media_asset_id
              )

              if (!asset) return null

              const {
                data: signedData,
                error: signedError,
              } = await supabase.storage
                .from('listing-media')
                .createSignedUrl(
                  asset.storage_path,
                  60 * 60
                )

              if (
                signedError ||
                !signedData?.signedUrl
              ) {
                console.error(
                  'Could not create signed image URL:',
                  signedError
                )

                return null
              }

              return {
                id: asset.id,
                signedUrl:
                  signedData.signedUrl,
                mimeType:
                  asset.mime_type,
                sortOrder:
                  item.sort_order ?? 0,
              }
            }
          )
        )

      galleryImages = signedResults.filter(
        (
          image
        ): image is {
          id: string
          signedUrl: string
          mimeType: string | null
          sortOrder: number
        } => image !== null
      )
    }
  }

  const { data: listingDocuments } = await supabase
    .from('listing_documents')
    .select('document_id')
    .eq('listing_id', listing.id)

  const documentIds =
    listingDocuments?.map(
      (item) => item.document_id
    ) ?? []

  let signedDocuments: {
    id: string
    fileName: string
    documentType: string | null
    fileSize: number | null
    signedUrl: string
  }[] = []

  if (documentIds.length > 0) {
    const { data: documents } = await supabase
      .from('documents')
      .select(
        'id, storage_path, file_name, document_type, file_size'
      )
      .in('id', documentIds)

    if (documents) {
      const signedResults = await Promise.all(
        documents.map(async (document) => {
          const {
            data: signedData,
            error: signedError,
          } = await supabase.storage
            .from('listing-documents')
            .createSignedUrl(
              document.storage_path,
              60 * 60
            )

          if (
            signedError ||
            !signedData?.signedUrl
          ) {
            console.error(
              'Could not create signed document URL:',
              signedError
            )

            return null
          }

          return {
            id: document.id,
            fileName: document.file_name,
            documentType:
              document.document_type,
            fileSize:
              document.file_size === null
                ? null
                : Number(document.file_size),
            signedUrl:
              signedData.signedUrl,
          }
        })
      )

      signedDocuments = signedResults.filter(
        (
          document
        ): document is {
          id: string
          fileName: string
          documentType: string | null
          fileSize: number | null
          signedUrl: string
        } => document !== null
      )
    }
  }

  const details =
    listing.details &&
    typeof listing.details === 'object' &&
    !Array.isArray(listing.details)
      ? (listing.details as Record<string, unknown>)
      : {}

  const detailValue = (key: string) => {
    const value = details[key]

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null
    }

    return String(value)
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {formatTransactionType(listing.transaction_type)}
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                {listing.title || 'Untitled Listing'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/dashboard/listings/${listing.id}/edit`}
                className="inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Edit Listing
              </Link>

              <span className="inline-flex w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-700">
                {formatStatus(listing.status)}
              </span>
            </div>
          </div>

          <div className="mt-5">
            <ListingStatusActions
              listingId={listing.id}
              status={listing.status}
              transactionType={listing.transaction_type}
            />
          </div>

          {listing.status === 'UNDER_REVIEW' && (
            <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-4">
              <p className="font-semibold text-teal-950">
                Listing submitted for review
              </p>

              <p className="mt-1 text-sm leading-6 text-teal-800">
                This listing is saved successfully but is not publicly active yet.
              </p>
            </div>
          )}
        </div>

        {galleryImages.length > 0 && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-lg font-bold text-gray-900">
                Property Photos
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {galleryImages.length} image
                {galleryImages.length === 1
                  ? ''
                  : 's'}{' '}
                attached to this listing.
              </p>
            </div>

            {galleryImages.length === 1 ? (
              <div className="p-4 sm:p-6">
                <img
                  src={
                    galleryImages[0]
                      .signedUrl
                  }
                  alt={
                    listing.title
                      ? `${listing.title} property photo`
                      : 'Commercial property photo'
                  }
                  className="max-h-[560px] w-full rounded-xl object-cover"
                />
              </div>
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
                {galleryImages.map(
                  (image, index) => (
                    <div
                      key={image.id}
                      className={
                        index === 0
                          ? 'overflow-hidden rounded-xl sm:col-span-2'
                          : 'overflow-hidden rounded-xl'
                      }
                    >
                      <img
                        src={image.signedUrl}
                        alt={
                          listing.title
                            ? `${listing.title} property photo ${index + 1}`
                            : `Commercial property photo ${index + 1}`
                        }
                        className="h-64 w-full object-cover"
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}

        {signedDocuments.length > 0 && (
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Documents
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Private documents attached to this listing.
                </p>
              </div>

              <span className="text-xs font-semibold text-gray-500">
                {signedDocuments.length} of 2 documents
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {signedDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {document.fileName}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      PDF
                      {document.fileSize !== null
                        ? ` • ${(
                            document.fileSize /
                            1024 /
                            1024
                          ).toFixed(1)} MB`
                        : ''}
                    </p>
                  </div>

                  <a
                    href={document.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-teal-500 hover:text-teal-800"
                  >
                    View PDF
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">
              Property
            </h2>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-gray-500">Property type</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {detailValue('propertyTypeName') || 'Not specified'}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Building area</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {formatArea(
                    listing.area_sqm === null
                      ? null
                      : Number(listing.area_sqm)
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Lot area</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {formatArea(
                    listing.lot_area_sqm === null
                      ? null
                      : Number(listing.lot_area_sqm)
                  )}
                </dd>
              </div>

              {detailValue('yearBuilt') && (
                <div>
                  <dt className="text-gray-500">Year built</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {detailValue('yearBuilt')}
                  </dd>
                </div>
              )}

              {detailValue('zoning') && (
                <div>
                  <dt className="text-gray-500">Zoning</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {detailValue('zoning')}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">
              Location
            </h2>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {property?.address_line_1 || 'Not specified'}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">City</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {cityName || 'Not specified'}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Province / Region</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {regionName || 'Not specified'}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Postal code</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {property?.postal_code || 'Not specified'}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Location privacy</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {formatStatus(listing.location_privacy)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">
              Financial
            </h2>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-gray-500">Price / Rate</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {formatMoney(
                    listing.price_amount_minor === null
                      ? null
                      : Number(listing.price_amount_minor),
                    listing.price_currency
                  )}
                </dd>
              </div>

              {listing.price_frequency && (
                <div>
                  <dt className="text-gray-500">Frequency</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {listing.price_frequency}
                  </dd>
                </div>
              )}

              {detailValue('propertyTaxes') && (
                <div>
                  <dt className="text-gray-500">Property taxes</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {detailValue('propertyTaxes')}
                  </dd>
                </div>
              )}

              {detailValue('noi') && (
                <div>
                  <dt className="text-gray-500">NOI</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {detailValue('noi')}
                  </dd>
                </div>
              )}

              {detailValue('capRate') && (
                <div>
                  <dt className="text-gray-500">Cap rate</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {detailValue('capRate')}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">
              Representative
            </h2>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {contact?.display_name || 'Not specified'}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Role</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {contact?.title ||
                    representative?.role ||
                    'Not specified'}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {contact?.email || 'Not specified'}
                </dd>
              </div>

              {contact?.phone && (
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {contact.phone}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">
            Description
          </h2>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">
            {listing.description || 'No description provided.'}
          </p>

          {detailValue('highlights') && (
            <>
              <h3 className="mt-6 font-semibold text-gray-900">
                Highlights
              </h3>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {detailValue('highlights')}
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
