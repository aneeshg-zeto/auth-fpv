'use client'

import { useCallback, useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'
import type { ClientWebAuthnConfig } from './useRegister'

const defaultRoutes = {
  registerBegin: '/api/auth/register/begin',
  registerFinish: '/api/auth/register/finish',
  loginBegin: '/api/auth/login/begin',
  loginFinish: '/api/auth/login/finish',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
}

export function useLogin(config?: ClientWebAuthnConfig) {
  const routes = { ...defaultRoutes, ...config?.routes }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startLogin = useCallback(async (username: string) => {
    setLoading(true)
    setError(null)
    try {
      const beginResponse = await fetch(routes.loginBegin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const options = await beginResponse.json()
      if (!beginResponse.ok || options.error) {
        throw new Error(options.error ?? 'Failed to begin login')
      }
      const credential = await startAuthentication({ optionsJSON: options })
      const finishResponse = await fetch(routes.loginFinish, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, credential }),
      })
      const result = await finishResponse.json()
      if (!finishResponse.ok || result.error) {
        throw new Error(result.error ?? 'Failed to finish login')
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [routes.loginBegin, routes.loginFinish])

  return { startLogin, loading, error }
}
