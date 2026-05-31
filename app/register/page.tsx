'use client';
import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');

  const handleRegister = async () => {
    setStatus('📡 Contacting server...');
    try {
      const res = await fetch('/api/register/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!data.options) throw new Error(data.error || 'No options');

      setStatus('🔐 Please scan your fingerprint when prompted...');
      const attestationResponse = await startRegistration({
        optionsJSON: data.options
      });

      const finishRes = await fetch('/api/register/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          attestationResponse,
          userId: data.userId,
        }),
      });
      const result = await finishRes.json();
      if (result.success) {
        setStatus('✅ Registration successful! You can now login.');
      } else {
        setStatus('❌ Registration failed: ' + result.error);
      }
    } catch (err: any) {
      setStatus('❌ Error: ' + err.message);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">📝 Register with Fingerprint</h1>
      <input
        type="text"
        placeholder="Choose a username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 my-2 w-full rounded"
      />
      <button
        onClick={handleRegister}
        disabled={!username}
        className="bg-blue-500 disabled:bg-gray-400 text-white px-4 py-2 rounded w-full"
      >
        Register & Scan Fingerprint
      </button>
      <p className="mt-4 text-sm whitespace-pre-wrap">{status}</p>
    </div>
  );
}