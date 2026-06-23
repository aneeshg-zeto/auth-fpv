'use client'

import { useCallback, useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'

export interface ClientWebAuthnConfig {
  routes?: Partial<{
    registerBegin: string
    registerFinish: string
    loginBegin: string
    loginFinish: string
    logout: string
    me: string
  }>
}

const defaultRoutes = {
  registerBegin: '/api/auth/register/begin',
  registerFinish: '/api/auth/register/finish',
  loginBegin: '/api/auth/login/begin',
  loginFinish: '/api/auth/login/finish',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
}

export function useRegister(config?: ClientWebAuthnConfig) {
  const routes = { ...defaultRoutes, ...config?.routes }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startRegister = useCallback(async (username: string) => {
    setLoading(true)
    setError(null)
    try {
      const beginRes = await fetch(routes.registerBegin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const beginData = await beginRes.json()
      if (!beginRes.ok || beginData.error) {
        throw new Error(beginData.error ?? 'Failed to begin registration')
      }
      const { challengeId, ...options } = beginData
      const credential = await startRegistration({ optionsJSON: options })
      const finishRes = await fetch(routes.registerFinish, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, credential, challengeId }),
      })
      const result = await finishRes.json()
      if (!finishRes.ok || result.error) {
        throw new Error(result.error ?? 'Failed to finish registration')
      }
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [routes.registerBegin, routes.registerFinish])

  return { startRegister, loading, error }
}
