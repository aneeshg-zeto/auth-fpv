'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ClientWebAuthnConfig } from './useRegister'

export interface WebAuthnSession {
  userId: string
  username: string
  expiresAt: number
  devices: string[]
}

const defaultRoutes = {
  registerBegin: '/api/auth/register/begin',
  registerFinish: '/api/auth/register/finish',
  loginBegin: '/api/auth/login/begin',
  loginFinish: '/api/auth/login/finish',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
}

export function useSession(config?: ClientWebAuthnConfig) {
  const routes = { ...defaultRoutes, ...config?.routes }
  const [user, setUser] = useState<WebAuthnSession | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(routes.me, { credentials: 'same-origin' })
      if (!response.ok) {
        setUser(null)
        return null
      }
      const data = (await response.json()) as WebAuthnSession
      setUser(data)
      return data
    } finally {
      setLoading(false)
    }
  }, [routes.me])

  const logout = useCallback(async () => {
    await fetch(routes.logout, { method: 'POST', credentials: 'same-origin' })
    setUser(null)
  }, [routes.logout])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { user, loading, refresh, logout }
}
