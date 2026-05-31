'use client';
import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setStatus('📡 Requesting challenge...');
    try {
      const res = await fetch('/api/login/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!data.options) throw new Error(data.error || 'No options');

      setStatus('🔐 Please scan your fingerprint to login...');
      const assertionResponse = await startAuthentication({
        optionsJSON: data.options
      });

      const finishRes = await fetch('/api/login/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          assertionResponse,
          sessionId: data.sessionId,
        }),
      });
      const result = await finishRes.json();
      if (result.success) {
        setStatus('✅ Login successful! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        setStatus('❌ Login failed: ' + result.error);
      }
    } catch (err: any) {
      setStatus('❌ Error: ' + err.message);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">🔑 Login with Fingerprint</h1>
      <input
        type="text"
        placeholder="Your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 my-2 w-full rounded"
      />
      <button
        onClick={handleLogin}
        disabled={!username}
        className="bg-green-500 disabled:bg-gray-400 text-white px-4 py-2 rounded w-full"
      >
        Login & Scan Fingerprint
      </button>
      <p className="mt-4 text-sm whitespace-pre-wrap">{status}</p>
    </div>
  );
}