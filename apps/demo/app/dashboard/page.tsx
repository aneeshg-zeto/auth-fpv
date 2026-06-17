'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserSession {
  username: string
  userId: string
  expiresAt: number
  devices: string[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setUser(data))
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!user?.expiresAt) return
    const interval = setInterval(() => {
      const remaining = Math.max(0, user.expiresAt - Math.floor(Date.now() / 1000))
      setTimeLeft(remaining)
      if (remaining === 0) {
        clearInterval(interval)
        router.push('/login')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [user, router])

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`
  }

  const s: Record<string, React.CSSProperties> = {
    container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" },
    card: { width: '100%', maxWidth: 560, padding: 48, border: '1px solid #222' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: 24, marginBottom: 32 },
    title: { fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' },
    badge: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: '1px solid #333', fontSize: 12, color: '#999' },
    dot: { width: 8, height: 8, borderRadius: '50%', background: '#4ade80' },
    profileSection: { border: '1px solid #222', padding: 32, marginBottom: 32 },
    avatar: { width: 56, height: 56, borderRadius: '50%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 },
    greeting: { fontSize: 22, fontWeight: 600, color: '#fff' },
    subtext: { fontSize: 14, color: '#666', marginTop: 4 },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 },
    infoCard: { border: '1px solid #222', padding: 16 },
    infoLabel: { fontSize: 11, color: '#666', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 },
    infoValue: { fontSize: 14, color: '#ccc' },
    securitySection: { border: '1px solid #222', padding: 32, marginBottom: 32 },
    securityTitle: { fontSize: 14, fontWeight: 600, color: '#ccc', marginBottom: 16 },
    securityItem: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
    securityDot: { width: 8, height: 8, borderRadius: '50%', background: '#4ade80' },
    securityText: { fontSize: 13, color: '#888' },
    actions: { display: 'flex', gap: 12, borderTop: '1px solid #222', paddingTop: 24 },
    btnSecondary: { padding: '12px 24px', border: '1px solid #333', background: '#000', color: '#ccc', fontSize: 14, cursor: 'pointer' },
  }

  if (!user) {
    return (
      <div style={s.container}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={s.container}>
      <div style={s.card as React.CSSProperties}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Dashboard</h1>
            <p style={s.subtext}>Authenticated via WebAuthn — For Mac</p>
          </div>
          <div style={s.badge}>
            <div style={s.dot}></div>
            Active Session
          </div>
        </div>

        <div style={s.profileSection}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={s.avatar}>{user.username[0].toUpperCase()}</div>
            <div>
              <h2 style={s.greeting}>Welcome, {user.username}</h2>
              <p style={s.subtext}>You are securely signed in</p>
            </div>
          </div>

          <div style={s.infoGrid}>
            <div style={s.infoCard}>
              <p style={s.infoLabel}>User ID</p>
              <p style={{ ...s.infoValue, fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 12 }}>{user.userId}</p>
            </div>
            <div style={s.infoCard}>
              <p style={s.infoLabel}>Device</p>
              <p style={s.infoValue}>{user.devices.join(', ') || 'Biometric Key'}</p>
            </div>
            <div style={s.infoCard}>
              <p style={s.infoLabel}>Session Expires</p>
              <p style={s.infoValue}>{timeLeft !== null ? formatTime(timeLeft) : '...'}</p>
            </div>
            <div style={s.infoCard}>
              <p style={s.infoLabel}>Auth Method</p>
              <p style={{ ...s.infoValue, color: '#4ade80' }}>Biometric (WebAuthn)</p>
            </div>
          </div>
        </div>

        <div style={s.securitySection}>
          <h3 style={s.securityTitle}>Security Status</h3>
          <div style={s.securityItem}><div style={s.securityDot}></div><span style={s.securityText}>Signature verified via WebAuthn</span></div>
          <div style={s.securityItem}><div style={s.securityDot}></div><span style={s.securityText}>Session encrypted (HttpOnly + Secure)</span></div>
          <div style={s.securityItem}><div style={s.securityDot}></div><span style={s.securityText}>No passwords stored or transmitted</span></div>
        </div>

        <div style={s.actions}>
          <button
            style={s.btnSecondary}
            onClick={handleLogout}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#ccc' }}
          >
            Sign Out
          </button>
          <a
            style={s.btnSecondary}
            href="/"
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#ccc' }}
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
