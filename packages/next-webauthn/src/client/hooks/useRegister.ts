'use client';

import { useCallback, useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { useClientWebAuthnConfig, type ClientWebAuthnConfig } from './useWebAuthnConfig';

export function useRegister(config?: ClientWebAuthnConfig) {
  const { routes } = useClientWebAuthnConfig(config);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRegister = useCallback(async (username: string) => {
    setLoading(true);
    setError(null);

    try {
      const beginResponse = await fetch(routes.registerBegin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const options = await beginResponse.json();

      if (!beginResponse.ok || options.error) {
        throw new Error(options.error ?? 'Failed to begin registration');
      }

      const credential = await startRegistration({ optionsJSON: options });

      const finishResponse = await fetch(routes.registerFinish, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, credential }),
      });
      const result = await finishResponse.json();

      if (!finishResponse.ok || result.error) {
        throw new Error(result.error ?? 'Failed to finish registration');
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [routes.registerBegin, routes.registerFinish]);

  return { startRegister, loading, error };
}
