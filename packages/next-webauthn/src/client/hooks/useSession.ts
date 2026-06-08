'use client';

import { useCallback, useEffect, useState } from 'react';
import { useClientWebAuthnConfig, type ClientWebAuthnConfig } from './useWebAuthnConfig';

export interface WebAuthnSession {
  userId: string;
  username: string;
  expiresAt: number;
  devices: string[];
}

export function useSession(config?: ClientWebAuthnConfig) {
  const { routes } = useClientWebAuthnConfig(config);
  const [user, setUser] = useState<WebAuthnSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(routes.me, { credentials: 'same-origin' });
      if (!response.ok) {
        setUser(null);
        return null;
      }
      const data = (await response.json()) as WebAuthnSession;
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [routes.me]);

  const logout = useCallback(async () => {
    await fetch(routes.logout, { method: 'POST', credentials: 'same-origin' });
    setUser(null);
  }, [routes.logout]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { user, loading, refresh, logout };
}
