'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { startAuthentication } from '@simplewebauthn/browser';

interface UserSession {
  username: string;
  userId: string;
  expiresAt: number;
  devices: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');

  const fetchSession = () => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setUser(data);
        setStatus('');
        setStatusType('');
      })
      .catch(() => router.push('/login'));
  };

  useEffect(() => {
    fetchSession();
  }, [router]);

  // Session countdown timer
  useEffect(() => {
    if (!user?.expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, user.expiresAt - Math.floor(Date.now() / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        router.push('/login');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, router]);

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  // Extend current session silently using the registered biometric credential
  async function handleRenewSession() {
    if (!user) return;
    setRenewing(true);
    setStatus('Initializing session renewal...');
    setStatusType('');

    try {
      const opts = await fetch('/api/login/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      }).then((r) => r.json());

      if (opts.error) {
        setRenewing(false);
        setStatusType('error');
        return setStatus(`Error: ${opts.error}`);
      }

      setStatus('Please authorize biometric prompt to extend session...');
      const credential = await startAuthentication({ optionsJSON: opts });

      setStatus('Renewing session on server...');
      const result = await fetch('/api/login/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, credential }),
      }).then((r) => r.json());

      setRenewing(false);

      if (result.verified) {
        setStatusType('success');
        setStatus('Session renewed successfully!');
        fetchSession(); // refresh data
      } else {
        setStatusType('error');
        setStatus(`Renewal failed: ${result.error}`);
      }
    } catch (err) {
      setRenewing(false);
      setStatusType('error');
      setStatus(`Error: ${(err as Error).message}`);
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-zinc-400 text-sm">Loading secure dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden">
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      <div className="w-full max-w-xl glass-card rounded-2xl p-8 flex flex-col relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Secure Dashboard
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Biometric Authorization Protocol Active
            </p>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Encrypted Session
          </div>
        </div>

        {/* Welcome Block */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-zinc-200">
            Welcome, <span className="text-blue-400 font-bold">{user.username}</span> 👋
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            You successfully logged in using your secure device hardware. No password was sent or stored.
          </p>

          <div className="mt-4 border-t border-zinc-800/60 pt-4 flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Authorized Device(s):</span>
              <span className="text-zinc-300 font-medium">
                {user.devices.join(', ') || 'Secure Biometric Key'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">User ID Signature:</span>
              <span className="text-zinc-400 font-mono text-[10px] truncate max-w-[200px]">
                {user.userId}
              </span>
            </div>
          </div>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              Session Remaining
            </span>
            <div className="text-lg font-bold text-zinc-200 mt-2 font-mono">
              {timeLeft !== null ? formatTime(timeLeft) : 'Calculating...'}
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              Extend / Renew session
            </span>
            <button
              className="mt-2 text-xs font-semibold py-2 px-3 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
              onClick={handleRenewSession}
              disabled={renewing}
            >
              {renewing ? 'Renewing...' : 'Renew Session'}
            </button>
          </div>
        </div>

        {status && (
          <div
            className={`p-3 rounded-lg text-xs border text-center mb-6 transition-all ${
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

        {/* Footer Actions */}
        <div className="flex gap-4 border-t border-zinc-800/80 pt-6">
          <button
            className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs py-3 rounded-lg transition-all"
            onClick={handleLogout}
          >
            Secure Log Out
          </button>
        </div>
      </div>
    </main>
  );
}
