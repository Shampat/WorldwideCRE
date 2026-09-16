import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NotificationActions from './notification-actions'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatType(type: string) {
  return type
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, message, data, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error(error.message)
  }

  const notifications = data ?? []
  const unreadCount = notifications.filter(
    (notification) => !notification.read_at
  ).length

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-gray-700 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Activity
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
              Notifications
            </h1>

            <p className="mt-3 text-gray-600">
              Listing freshness, expiry and marketplace reminders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700">
              {unreadCount} unread
            </div>

            {unreadCount > 0 && (
              <NotificationActions mode="all" />
            )}
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {notifications.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                You're all caught up
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                WorldwideCRE will show listing reminders and important
                marketplace activity here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => {
                const notificationData =
                  notification.data &&
                  typeof notification.data === 'object' &&
                  !Array.isArray(notification.data)
                    ? (notification.data as Record<string, unknown>)
                    : {}

                const listingId =
                  typeof notificationData.listing_id === 'string'
                    ? notificationData.listing_id
                    : null

                return (
                  <article
                    key={notification.id}
                    className={
                      notification.read_at
                        ? 'px-6 py-5'
                        : 'bg-slate-50 px-6 py-5'
                    }
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {!notification.read_at && (
                            <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white">
                              New
                            </span>
                          )}

                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {formatType(notification.type)}
                          </span>
                        </div>

                        <h2 className="mt-2 text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {notification.message}
                        </p>

                        <p className="mt-3 text-xs text-gray-400">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        {listingId && (
                          <Link
                            href={`/dashboard/listings/${listingId}`}
                            className="text-sm font-semibold text-gray-900 hover:underline"
                          >
                            View Listing →
                          </Link>
                        )}

                        {!notification.read_at && (
                          <NotificationActions
                            mode="single"
                            notificationId={notification.id}
                          />
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
