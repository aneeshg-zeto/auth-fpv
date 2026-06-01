'use client';
import { useEffect, useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error' | ''>('');
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Check if user is already authenticated
    fetch('/api/me')
      .then((r) => {
        if (r.ok) {
          router.push('/dashboard');
        }
      })
      .catch(() => {});

    // 2. Check if biometric credentials are supported
    if (typeof window !== 'undefined') {
      const hasCreds = !!window.PublicKeyCredential;
      setIsSupported(hasCreds);
    }
  }, [router]);

  async function handleRegister() {
    if (!username.trim()) {
      setStatusType('error');
      return setStatus('Please enter a username.');
    }

    setIsLoading(true);
    setStatusType('info');
    setStatus('Initializing registration options...');

    try {
      const opts = await fetch('/api/register/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      }).then((r) => r.json());

      if (opts.error) {
        setIsLoading(false);
        setStatusType('error');
        return setStatus(`Error: ${opts.error}`);
      }

      setStatus('Please authorize the biometric prompt (Touch ID / Face ID / Hello)...');

      // Browser shows biometric prompt here (Touch ID / Windows Hello)
      const credential = await startRegistration({ optionsJSON: opts });

      setStatus('Finalizing secure registration on server...');

      const result = await fetch('/api/register/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, credential }),
      }).then((r) => r.json());

      setIsLoading(false);

      if (result.verified) {
        setStatusType('success');
        setStatus('Registration successful! Redirecting to sign in...');
        setTimeout(() => router.push('/login'), 1500);
      } else {
        setStatusType('error');
        setStatus(`Failed: ${result.error}`);
      }
    } catch (err) {
      setIsLoading(false);
      setStatusType('error');
      setStatus(`Error: ${(err as Error).message}`);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden">
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 flex flex-col items-center relative z-10 transition-all duration-300">
        {/* Animated Fingerprint Hero SVG */}
        <div className="mb-6 p-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 relative">
          {isLoading && (
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin"></div>
          )}
          <svg
            className={`w-12 h-12 transition-all duration-300 ${isLoading ? 'scale-90 opacity-60' : 'scale-100 hover:scale-105'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19v4m-4-4h8" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
          Create Account
        </h1>
        <p className="text-zinc-400 text-sm mt-2 text-center">
          Secure, passwordless biometric authorization
        </p>

        {isSupported === false && (
          <div className="w-full mt-6 p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs leading-relaxed text-center">
            ⚠️ <strong>Biometrics Unavailable</strong>
            <p className="mt-1">
              Your current device, OS, or browser does not support biometric credentials, or this page is not running over a secure connection (HTTPS).
            </p>
          </div>
        )}

        {isSupported !== false && (
          <div className="w-full flex flex-col gap-4 mt-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Username
              </label>
              <input
                className="w-full bg-zinc-900/60 border border-zinc-700/60 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleRegister()}
                disabled={isLoading}
              />
            </div>

            <button
              className="w-full btn-primary text-white font-medium text-sm py-3 rounded-lg flex items-center justify-center gap-2"
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                'Register with Biometrics'
              )}
            </button>
          </div>
        )}

        {/* Clear Instructions Block */}
        <div className="w-full mt-6 bg-zinc-900/40 border border-zinc-800 rounded-lg p-3 text-[11px] text-zinc-400 space-y-1.5">
          <p className="font-semibold text-zinc-300">How to register:</p>
          <p>1. Enter your preferred username above.</p>
          <p>2. Press register and wait for the browser prompt.</p>
          <p>3. Select <strong className="text-zinc-300">iCloud Keychain / Touch ID</strong> or your platform device to save your secure key.</p>
        </div>

        {status && (
          <div
            className={`w-full mt-4 p-3 rounded-lg text-xs border text-center transition-all ${
              statusType === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : statusType === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300'
            }`}
          >
            {status}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 items-center text-xs">
          <a href="/login" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </main>
  );
}