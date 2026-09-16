import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold text-white">
            WorldwideCRE
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-white/90 md:flex">
            <a href="#find-property" className="hover:text-white">
              Find Property
            </a>

            <a href="#how-it-works" className="hover:text-white">
              How It Works
            </a>

            <a href="#list-property" className="hover:text-white">
              List Property
            </a>
          </nav>

          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      <section
        id="find-property"
        className="bg-gray-950 px-6 pb-28 pt-36 text-white"
      >
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Commercial Real Estate Worldwide
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Find commercial property worldwide.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            Search smarter, discover fresher listings, and connect directly with
            commercial property representatives.
          </p>

          <div className="mx-auto mt-10 max-w-4xl rounded-2xl bg-white p-3 text-left shadow-2xl">
            <div className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
              <input
                type="text"
                placeholder="Try: 10,000 sq ft warehouse in Mississauga under $4M"
                className="rounded-xl border border-gray-200 px-4 py-4 text-gray-900 outline-none"
              />

              <select className="rounded-xl border border-gray-200 px-4 py-4 text-gray-900 outline-none">
                <option>For Sale</option>
                <option>For Lease</option>
                <option>For Sublease</option>
              </select>

              <button className="rounded-xl bg-gray-900 px-5 py-4 font-semibold text-white hover:bg-gray-700">
                Search
              </button>
            </div>
          </div>

          <p className="mt-5 text-sm text-gray-400">
            AI-powered search • Commercial property only • Worldwide
          </p>
        </div>
      </section>

      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold">How WorldwideCRE works</h2>
            <p className="mt-3 text-gray-600">
              A simpler commercial property marketplace built around fresh
              listings and direct connections.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 p-7">
              <p className="text-sm font-semibold text-gray-500">01</p>
              <h3 className="mt-3 text-xl font-semibold">Search naturally</h3>
              <p className="mt-3 text-gray-600">
                Describe the commercial property you need and refine it with
                structured filters.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-7">
              <p className="text-sm font-semibold text-gray-500">02</p>
              <h3 className="mt-3 text-xl font-semibold">
                Review better listings
              </h3>
              <p className="mt-3 text-gray-600">
                See freshness, location confidence, property details, and trust
                signals clearly.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-7">
              <p className="text-sm font-semibold text-gray-500">03</p>
              <h3 className="mt-3 text-xl font-semibold">
                Contact representatives
              </h3>
              <p className="mt-3 text-gray-600">
                Call, WhatsApp, or email the listing representative directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="list-property" className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-10 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Owners • Agents • Developers • Property Managers
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            List your commercial property.
          </h2>

          <p className="mt-4 max-w-2xl text-gray-600">
            Create a professional listing, use AI to help prepare the details,
            and keep availability current automatically.
          </p>

          <Link
            href={user ? '/dashboard' : '/auth'}
            className="mt-7 inline-block rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white hover:bg-gray-700"
          >
            {user ? 'Go to Dashboard' : 'Get Started'}
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 px-6 py-8">
        <div className="mx-auto max-w-7xl text-sm text-gray-500">
          © 2026 WorldwideCRE
        </div>
      </footer>
    </main>
  )
}
