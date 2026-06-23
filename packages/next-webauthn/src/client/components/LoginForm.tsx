'use client'

import { useState } from 'react'
import { useLogin } from '../hooks/useLogin'
import type { ClientWebAuthnConfig } from '../hooks/useRegister'

interface LoginFormProps {
  className?: string
  config?: ClientWebAuthnConfig
  onSuccess?: (result: unknown, username?: string) => void
  onError?: (error: Error) => void
  submitLabel?: string
}

export function LoginForm({
  className = '',
  config,
  onSuccess,
  onError,
  submitLabel = 'Sign in with Biometrics',
}: LoginFormProps) {
  const [username, setUsername] = useState('')
  const { startLogin, startConditionalLogin, loading, error } = useLogin(config)

  return (
    <form
      className={className}
      onSubmit={async (e) => {
        e.preventDefault()
        try {
          const result = await (username.trim()
            ? startLogin(username)
            : startConditionalLogin())
          onSuccess?.(result, username.trim() || undefined)
        } catch (err) {
          onError?.(err instanceof Error ? err : new Error('Login failed'))
        }
      }}
    >
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username (optional for passkey)"
        autoComplete="username webauthn"
        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="mt-3 w-full px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Signing in...' : submitLabel}
      </button>
      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
    </form>
  )
}
