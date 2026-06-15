'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const [status, setStatus] = useState('');

  const fetchSession = () => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setUser(data);
        setStatus('');
      })
      .catch(() => router.push('/login'));
  };

  useEffect(() => {
    fetchSession();
  }, [router]);

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

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: '#030014' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
          <p className="text-zinc-400 text-sm">Loading secure dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden" style={{ background: '#030014' }}>
      <div className="hero-glow top-1/4 -left-32" />
      <div className="hero-glow-2 bottom-1/4 -right-32" />

      <div className="w-full max-w-2xl glass-card rounded-2xl p-8 md:p-10 relative z-10">
        <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Dashboard
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Authenticated via WebAuthn
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-medium text-emerald-400">Active Session</span>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 md:p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Welcome, {user.username}
              </h2>
              <p className="text-sm text-zinc-400">
                You are securely signed in
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">User ID</p>
              <p className="text-sm text-zinc-300 font-mono truncate">{user.userId}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Device</p>
              <p className="text-sm text-zinc-300">{user.devices.join(', ') || 'Biometric Key'}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Session Expires</p>
              <p className="text-sm text-zinc-300 font-mono">
                {timeLeft !== null ? formatTime(timeLeft) : 'Calculating...'}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Auth Method</p>
              <p className="text-sm text-emerald-400">Biometric (WebAuthn)</p>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">Security Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-sm text-zinc-400">Signature verified via WebAuthn</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-sm text-zinc-400">Session encrypted (HttpOnly + Secure)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-sm text-zinc-400">No passwords stored or transmitted</span>
            </div>
          </div>
        </div>

        {status && (
          <div className="mb-6 p-3 rounded-lg text-xs border text-center bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
            {status}
          </div>
        )}

        <div className="flex gap-4 flex-wrap border-t border-white/5 pt-6">
          <button
            onClick={handleLogout}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white text-sm font-medium transition-all"
          >
            Sign Out
          </button>
          <a
            href="/"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white text-sm font-medium transition-all"
          >
            Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}
