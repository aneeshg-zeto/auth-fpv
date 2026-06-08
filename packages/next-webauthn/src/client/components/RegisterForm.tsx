'use client';

import { useState } from 'react';
import { useRegister } from '../hooks/useRegister';
import type { ClientWebAuthnConfig } from '../hooks/useWebAuthnConfig';

export function RegisterForm({
  className,
  config,
  onSuccessAction,
  submitLabel = 'Register with biometrics',
}: {
  className?: string;
  config?: ClientWebAuthnConfig;
  onSuccessAction?: (result: unknown, username: string) => void;
  submitLabel?: string;
}) {
  const [username, setUsername] = useState('');
  const { startRegister, loading, error } = useRegister(config);

  return (
    <form
      className={className}
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await startRegister(username);
        onSuccessAction?.(result, username);
      }}
    >
      <input
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="Username"
        autoComplete="username"
      />
      <button type="submit" disabled={loading || !username.trim()}>
        {loading ? 'Registering...' : submitLabel}
      </button>
      {error ? <p>{error}</p> : null}
    </form>
  );
}
