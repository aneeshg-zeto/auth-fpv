'use client'

import { useState } from 'react'
import { useLogin } from '../hooks/useLogin'
import type { ClientWebAuthnConfig } from '../hooks/useRegister'

export function LoginForm({
  className,
  config,
  onSuccessAction,
  submitLabel = 'Login with biometrics',
}: {
  className?: string
  config?: ClientWebAuthnConfig
  onSuccessAction?: (result: unknown, username: string) => void
  submitLabel?: string
}) {
  const [username, setUsername] = useState('')
  const { startLogin, loading, error } = useLogin(config)

  return (
    <form
      className={className}
      onSubmit={async (event) => {
        event.preventDefault()
        const result = await startLogin(username)
        onSuccessAction?.(result, username)
      }}
    >
      <input
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="Username"
        autoComplete="username"
      />
      <button type="submit" disabled={loading || !username.trim()}>
        {loading ? 'Signing in...' : submitLabel}
      </button>
      {error ? <p>{error}</p> : null}
    </form>
  )
}
