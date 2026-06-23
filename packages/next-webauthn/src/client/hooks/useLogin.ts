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
      const beginRes = await fetch(routes.loginBegin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const beginData = await beginRes.json()
      if (!beginRes.ok || beginData.error) {
        throw new Error(beginData.error ?? 'Failed to begin login')
      }
      const { challengeId, ...options } = beginData
      const credential = await startAuthentication({ optionsJSON: options })
      const finishRes = await fetch(routes.loginFinish, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, challengeId }),
      })
      const result = await finishRes.json()
      if (!finishRes.ok || result.error) {
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

  const startConditionalLogin = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const beginRes = await fetch(routes.loginBegin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'conditional' }),
      })
      const beginData = await beginRes.json()
      if (!beginRes.ok || beginData.error) {
        throw new Error(beginData.error ?? 'Failed to begin conditional login')
      }
      const { challengeId, ...options } = beginData
      const credential = await startAuthentication({ optionsJSON: options, useBrowserAutofill: true })
      const finishRes = await fetch(routes.loginFinish, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, challengeId }),
      })
      const result = await finishRes.json()
      if (!finishRes.ok || result.error) {
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

  return { startLogin, startConditionalLogin, loading, error }
}
