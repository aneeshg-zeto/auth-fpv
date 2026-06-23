'use client'

import { useState } from 'react'
import { useLogin } from '../hooks/useLogin'
import type { ClientWebAuthnConfig } from '../hooks/useRegister'

interface AutoFillPasskeyButtonProps {
  config?: ClientWebAuthnConfig
  onSuccess?: (result: unknown) => void
  onError?: (error: Error) => void
  className?: string
}

export function AutoFillPasskeyButton({
  config,
  onSuccess,
  onError,
  className = '',
}: AutoFillPasskeyButtonProps) {
  const { startConditionalLogin, loading } = useLogin(config)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className={className}>
      <button
        onClick={async () => {
          setError(null)
          try {
            const result = await startConditionalLogin()
            onSuccess?.(result)
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Authentication failed'
            setError(message)
            onError?.(err instanceof Error ? err : new Error(message))
          }
        }}
        disabled={loading}
        className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
        title="Sign in with passkey"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a6 6 0 0 0-6 6c0 2.5 1.5 4.7 3.7 5.6" />
          <path d="M12 2a6 6 0 0 1 6 6c0 2.5-1.5 4.7-3.7 5.6" />
          <path d="M12 10a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0v-6a3 3 0 0 0-3-3z" />
          <path d="M12 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </svg>
      </button>
      {error ? <p className="mt-2 text-sm text-red-500 text-center">{error}</p> : null}
    </div>
  )
}
