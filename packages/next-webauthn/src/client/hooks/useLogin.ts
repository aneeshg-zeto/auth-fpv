'use client';

import { useCallback, useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { useClientWebAuthnConfig, type ClientWebAuthnConfig } from './useWebAuthnConfig';

export function useLogin(config?: ClientWebAuthnConfig) {
  const { routes } = useClientWebAuthnConfig(config);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startLogin = useCallback(async (username: string) => {
    setLoading(true);
    setError(null);

    try {
      const beginResponse = await fetch(routes.loginBegin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const options = await beginResponse.json();

      if (!beginResponse.ok || options.error) {
        throw new Error(options.error ?? 'Failed to begin login');
      }

      const credential = await startAuthentication({ optionsJSON: options });

      const finishResponse = await fetch(routes.loginFinish, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, credential }),
      });
      const result = await finishResponse.json();

      if (!finishResponse.ok || result.error) {
        throw new Error(result.error ?? 'Failed to finish login');
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [routes.loginBegin, routes.loginFinish]);

  return { startLogin, loading, error };
}
