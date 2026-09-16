'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup' | 'forgot'
type MessageType = 'success' | 'error' | 'warning' | null

export default function AuthPage() {
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<MessageType>(null)
  const [loading, setLoading] = useState(false)

  function clearFormMessage() {
    setMessage('')
    setMessageType(null)
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode)
    setPassword('')
    setConfirmPassword('')
    clearFormMessage()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearFormMessage()
    setLoading(true)

    try {
      if (mode === 'forgot') {
        if (!email.trim()) {
          setMessage('Enter your email address first.')
          setMessageType('warning')
          return
        }

        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
          }
        )

        if (error) {
          setMessage(error.message)
          setMessageType('error')
          return
        }

        setMessage(
          'Password reset email sent. Check your inbox and follow the recovery link.'
        )
        setMessageType('success')
        return
      }

      if (mode === 'signup') {
        if (!name.trim()) {
          setMessage('Please enter your name.')
          setMessageType('warning')
          return
        }

        if (password.length < 8) {
          setMessage('Password must be at least 8 characters.')
          setMessageType('warning')
          return
        }

        if (password !== confirmPassword) {
          setMessage('The two passwords do not match.')
          setMessageType('error')
          return
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: name.trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) {
          setMessage(error.message)
          setMessageType('error')
          return
        }

        setMessage(
          'Account created. We sent you a verification email. Confirm your email before signing in.'
        )
        setMessageType('success')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setMessage(
          error.message === 'Invalid login credentials'
            ? 'Invalid email or password. Check your credentials or use Forgot password.'
            : error.message
        )
        setMessageType('error')
        return
      }

      window.location.href = '/dashboard'
    } finally {
      setLoading(false)
    }
  }

  const messageClasses =
    messageType === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : messageType === 'error'
        ? 'border-red-200 bg-red-50 text-red-800'
        : 'border-yellow-200 bg-yellow-50 text-yellow-800'

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="mb-8 inline-block text-lg font-bold text-gray-900"
        >
          WorldwideCRE
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {mode !== 'forgot' ? (
            <>
              <div className="mb-8 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => changeMode('signin')}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    mode === 'signin'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={() => changeMode('signup')}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    mode === 'signup'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <h1 className="text-2xl font-bold text-gray-900">
                {mode === 'signin'
                  ? 'Welcome back'
                  : 'Create your WorldwideCRE account'}
              </h1>

              <p className="mt-2 text-sm text-gray-600">
                {mode === 'signin'
                  ? 'Sign in with the email and password you used when creating your account.'
                  : 'Use an email address you can access. You will need to verify it.'}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">
                Reset your password
              </h1>

              <p className="mt-2 text-sm text-gray-600">
                Enter your account email and we will send you a password recovery link.
              </p>
            </>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Your name
                </label>

                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === 'signup' ? 'new-password' : 'current-password'
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
                />

                {mode === 'signup' && (
                  <p className="mt-2 text-xs text-gray-500">
                    Use at least 8 characters. Your browser may offer to generate and save a strong password.
                  </p>
                )}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
                />
              </div>
            )}

            {mode === 'signin' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => changeMode('forgot')}
                  className="text-sm font-medium text-gray-700 underline hover:text-gray-900"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {message && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${messageClasses}`}
                role="alert"
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                  ? 'Sign In'
                  : mode === 'signup'
                    ? 'Create Account'
                    : 'Send Reset Link'}
            </button>
          </form>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => changeMode('signin')}
              className="mt-5 w-full text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
