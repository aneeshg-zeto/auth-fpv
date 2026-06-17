'use client'

import { useState } from 'react'

const s: Record<string, React.CSSProperties> = {
  page: { background: '#fff', color: '#000', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif", minHeight: '100vh', WebkitFontSmoothing: 'antialiased' },
  hero: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' as const, position: 'relative' as const, background: '#fff' },
  headline: { fontFamily: "'SF Mono', 'SF Pro Text', 'Fira Code', monospace", fontSize: 96, fontWeight: 700, color: '#000', letterSpacing: '-0.04em', lineHeight: 1 },
  subhead: { fontSize: 24, fontWeight: 400, color: '#666', maxWidth: 480, lineHeight: 1.5, marginTop: 24, letterSpacing: '0.01em' },
  fpsvg: { width: 80, height: 80, stroke: '#000', fill: 'none', strokeWidth: 1.0, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, opacity: 0.4, marginBottom: 8 },
  heroButtons: { display: 'flex', gap: 12, marginTop: 32 },
  heroBtn: { height: 48, padding: '0 28px', border: '1px solid #000', background: '#fff', color: '#000', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, letterSpacing: '0.01em', transition: 'all 0.15s ease' },
  installStrip: { background: '#fff', padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderBottom: '1px solid #e8e8e8' },
  installText: { fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 16, color: '#000' },
  copyBtn: { background: 'none', border: '1px solid #ccc', color: '#666', padding: '8px 20px', fontSize: 13, cursor: 'pointer', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif", transition: 'all 0.15s ease' },
  section: { padding: '120px 24px', maxWidth: 1100, margin: '0 auto' },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16 },
  sectionH2: { fontSize: 40, fontWeight: 600, color: '#000', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 56, maxWidth: 600 },
  featuresGrid: { display: 'flex', gap: 0, border: '1px solid #e8e8e8', overflow: 'hidden' as const },
  featureCard: { flex: 1, padding: '48px 40px', borderRight: '1px solid #e8e8e8', background: '#fafafa' },
  featureCardLast: { flex: 1, padding: '48px 40px', background: '#fafafa' },
  featureIcon: { width: 28, height: 28, stroke: '#000', fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, marginBottom: 20 },
  featureNum: { fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 12, color: '#bbb', letterSpacing: '0.05em', marginBottom: 8 },
  featureName: { fontSize: 20, fontWeight: 600, color: '#000', marginBottom: 12, letterSpacing: '-0.01em' },
  featureDesc: { fontSize: 14, color: '#666', lineHeight: 1.7, maxWidth: 280 },
  claimSection: { padding: '120px 24px', maxWidth: 880, margin: '0 auto', textAlign: 'center' as const, borderTop: '1px solid #e8e8e8' },
  claimText: { fontSize: 20, color: '#444', lineHeight: 1.8, maxWidth: 680, margin: '0 auto' },
  claimBold: { fontWeight: 700, color: '#000' },
  stepsSection: { padding: '120px 24px', maxWidth: 1100, margin: '0 auto' },
  stepsGrid: { display: 'flex', gap: 0, border: '1px solid #e8e8e8', overflow: 'hidden' as const },
  stepCard: { flex: 1, padding: '48px 40px', borderRight: '1px solid #e8e8e8', background: '#fafafa' },
  stepCardLast: { flex: 1, padding: '48px 40px', background: '#fafafa' },
  stepNum: { fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 12, color: '#bbb', letterSpacing: '0.05em', marginBottom: 16 },
  stepName: { fontSize: 20, fontWeight: 600, color: '#000', marginBottom: 12, letterSpacing: '-0.01em' },
  stepDesc: { fontSize: 14, color: '#666', lineHeight: 1.7 },
  footer: { borderTop: '1px solid #e8e8e8', padding: '48px 24px', textAlign: 'center' as const, fontSize: 13, color: '#999', lineHeight: 2, background: '#fafafa' },
  footerLinks: { display: 'flex', gap: 24, justifyContent: 'center', marginTop: 8 },
  footerLink: { color: '#888', cursor: 'pointer', transition: 'color 0.15s ease' },
}

export default function LandingPage() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install next-webauthn').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={s.page}>
      <section style={s.hero}>
        <img src="/image.png" alt="" style={{ width: 80, height: 80, opacity: 0.5, marginBottom: 8 }} />
        <h1 style={s.headline}>next-webauthn</h1>
        <p style={s.subhead}>Passkey auth for Next.js for Mac.</p>
        <div style={s.heroButtons}>
          <a style={s.heroBtn as React.CSSProperties} href="/register"
            onMouseEnter={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000' }}
          >Get Started →</a>
          <a style={s.heroBtn as React.CSSProperties} href="https://github.com/aneeshg-zeto/auth-fpv"
            onMouseEnter={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000' }}
          >View on GitHub ↗</a>
        </div>
      </section>

      <section style={s.installStrip}>
        <span style={s.installText}>npm install next-webauthn</span>
        <button
          style={s.copyBtn}
          onClick={handleCopy}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#000' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.color = '#666' }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </section>

      <section style={s.section}>
        <p style={s.sectionTitle}>Why next-webauthn?</p>
        <h2 style={s.sectionH2}>No passwords. No storage. One fingerprint.</h2>
        <div style={s.featuresGrid}>
          <div style={s.featureCard}>
            <p style={s.featureNum}>01</p>
            <img src="/image.png" alt="" style={s.featureIcon} />
            <div style={s.featureName}>Zero Passwords</div>
            <div style={s.featureDesc}>Touch ID and Face ID only. Nothing to remember, nothing to steal.</div>
          </div>
          <div style={s.featureCard}>
            <p style={s.featureNum}>02</p>
            <img src="/image.png" alt="" style={s.featureIcon} />
            <div style={s.featureName}>Zero Storage</div>
            <div style={s.featureDesc}>No localStorage. No cookies you don&apos;t control. SQLite server-side.</div>
          </div>
          <div style={s.featureCardLast}>
            <p style={s.featureNum}>03</p>
            <img src="/image.png" alt="" style={s.featureIcon} />
            <div style={s.featureName}>For Mac</div>
            <div style={s.featureDesc}>Built and optimized for macOS. Safari, Chrome, Arc — all supported.</div>
          </div>
        </div>
      </section>

      <section style={s.claimSection}>
        <div style={s.claimText}>
          <strong style={s.claimBold}>The first Next.js auth library built exclusively for platform passkeys.</strong>
          {' '}No passwords. No OAuth. No localStorage. No third-party services. Zero configuration authentication using nothing more than Touch ID and a single SQLite file.
        </div>
      </section>

      <section style={s.stepsSection}>
        <p style={s.sectionTitle}>How it works</p>
        <h2 style={s.sectionH2}>Fingerprint in, session out. Three steps.</h2>
        <div style={s.stepsGrid}>
          <div style={s.stepCard}>
            <p style={s.stepNum}>01</p>
            <div style={s.stepName}>Register</div>
            <div style={s.stepDesc}>Scan your fingerprint. A passkey is created and stored server-side.</div>
          </div>
          <div style={s.stepCard}>
            <p style={s.stepNum}>02</p>
            <div style={s.stepName}>Login</div>
            <div style={s.stepDesc}>Scan again. We verify the signature. No password ever sent.</div>
          </div>
          <div style={s.stepCardLast}>
            <p style={s.stepNum}>03</p>
            <div style={s.stepName}>Done</div>
            <div style={s.stepDesc}>An HttpOnly session cookie is set. You&apos;re in.</div>
          </div>
        </div>
      </section>

      <footer style={s.footer as React.CSSProperties}>
        <div>next-webauthn — For Mac — MIT License</div>
        <div style={s.footerLinks}>
          <a style={s.footerLink} href="https://github.com/aneeshg-zeto/auth-fpv"
            onMouseEnter={(e) => e.currentTarget.style.color = '#000'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
          >GitHub</a>
          <a style={s.footerLink} href="https://www.npmjs.com/package/next-webauthn"
            onMouseEnter={(e) => e.currentTarget.style.color = '#000'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
          >npm</a>
          <a style={s.footerLink} href="https://github.com/aneeshg-zeto/auth-fpv/blob/main/CONTRIBUTING.md"
            onMouseEnter={(e) => e.currentTarget.style.color = '#000'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
          >CONTRIBUTING</a>
          <a style={s.footerLink} href="https://github.com/aneeshg-zeto/auth-fpv/blob/main/SECURITY.md"
            onMouseEnter={(e) => e.currentTarget.style.color = '#000'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
          >SECURITY</a>
          <a style={s.footerLink} href="mailto:aneeshg@zeto.studio"
            onMouseEnter={(e) => e.currentTarget.style.color = '#000'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
          >Email</a>
        </div>
      </footer>
    </div>
  )
}
