'use client'

import { useEffect, useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'
import { useRouter } from 'next/navigation'

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  } as React.CSSProperties,
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 48,
    border: '1px solid #222',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 24,
  },
  fingerprint: {
    width: 64,
    height: 64,
    stroke: '#fff',
    fill: 'none',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  },
  heading: {
    fontSize: 24,
    fontWeight: 700,
    color: '#fff',
    textAlign: 'center' as const,
    letterSpacing: '-0.02em',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    lineHeight: 1.5,
  },
  input: {
    width: '100%',
    height: 48,
    background: '#000',
    border: '1px solid #444',
    color: '#fff',
    fontSize: 15,
    padding: '0 16px',
    outline: 'none',
  } as React.CSSProperties,
  button: {
    width: '100%',
    height: 48,
    background: '#000',
    color: '#fff',
    border: '1px solid #fff',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  errorBox: {
    width: '100%',
    padding: 12,
    border: '1px solid #666',
    borderLeft: '4px solid red',
    color: '#fff',
    fontSize: 13,
    lineHeight: 1.5,
  },
  infoBox: {
    width: '100%',
    padding: 12,
    border: '1px solid #444',
    color: '#999',
    fontSize: 13,
  },
  link: {
    color: '#888',
    fontSize: 13,
    cursor: 'pointer',
  },
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => { if (r.ok) router.push('/dashboard') })
      .catch(() => {})
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('registered')) {
        setError('Account created. Sign in with your passkey.')
      }
    }
  }, [router])

  async function handleLogin() {
    if (!username.trim()) { setError('Enter your username.'); return }
    setIsLoading(true)
    setError('')
    try {
      const opts = await fetch('/api/login/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      }).then((r) => r.json())

      if (opts.needsRegistration) {
        setIsLoading(false)
        router.push('/register?username=' + encodeURIComponent(username))
        return
      }

      if (opts.error) {
        setIsLoading(false)
        setError(opts.error)
        return
      }

      const credential = await startAuthentication({ optionsJSON: opts })

      const res = await fetch('/api/login/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
      const result = await res.json()

      setIsLoading(false)

      if (result.verified) {
        router.push('/dashboard')
      } else if (res.status === 404) {
        if (result.hint === 'stale_credential') {
          setError('Your passkey is outdated. Open System Settings → Passwords, delete the entry for this site, then register again.')
        } else if (result.hint === 'reregister') {
          router.push('/register?username=' + encodeURIComponent(result.username || username))
        } else {
          setError(result.error ?? 'Login failed.')
        }
      } else {
        setError(result.error ?? 'Authentication failed')
      }
    } catch (err) {
      setIsLoading(false)
      setError(err instanceof Error ? err.message : 'Authentication failed')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/image.png" alt="" style={styles.fingerprint} />
        <h1 style={styles.heading}>Sign in with Touch ID — For Mac</h1>
        <p style={styles.subtext}>No password. No storage. Just your fingerprint.</p>
        <input
          style={{
            ...styles.input,
            ...(isLoading ? { opacity: 0.5 } : {}),
          }}
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
          disabled={isLoading}
          onFocus={(e) => e.target.style.borderColor = '#fff'}
          onBlur={(e) => e.target.style.borderColor = '#444'}
        />
        <button
          style={{ ...styles.button, ...(isLoading ? styles.buttonDisabled : {}) }}
          onClick={handleLogin}
          disabled={isLoading}
          onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000' } }}
          onMouseLeave={(e) => { if (!isLoading) { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff' } }}
        >
          {isLoading ? 'Authorizing...' : 'Sign In'}
        </button>
        {error && <div style={styles.errorBox}>{error}</div>}
        <div style={{ ...styles.infoBox, fontSize: 11, lineHeight: 1.6 }}>
          How to sign in:<br />
          1. Enter your registered username.<br />
          2. Click sign in and authorize the secure device prompt.<br />
          3. Choose iCloud Keychain (Touch ID) when requested.
        </div>
        <a style={styles.link} href="/register">New here? Create account</a>
      </div>
    </div>
  )
}
