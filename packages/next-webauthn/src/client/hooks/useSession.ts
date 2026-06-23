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
  me: '/api/auth/me',
  logout: '/api/auth/logout',
}

export function useSession(config?: ClientWebAuthnConfig) {
  const routes = { ...defaultRoutes, ...config?.routes }
  const [user, setUser] = useState<WebAuthnSession | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(routes.me, { credentials: 'same-origin' })
      if (!res.ok) {
        setUser(null)
        return null
      }
      const data = (await res.json()) as WebAuthnSession
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
