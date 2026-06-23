import { FingerprintSVG } from '@/components/FingerprintSVG'
import { InstallCmd } from '@/components/InstallCmd'

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-32">
      <div className="max-w-6xl mx-auto text-center">
        <div className="mb-12">
          <span className="inline-flex items-center gap-2 text-sm text-muted border border-border rounded-full px-4 py-1.5">
            <FingerprintSVG size={14} className="text-fp" />
            v0.2.0 · Passkey Auth for Next.js
          </span>
        </div>
        <h1 className="tracking-tight font-bold text-7xl md:text-8xl lg:text-9xl leading-none mb-8">
          Login with a touch.
        </h1>
        <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-12">
          Drop-in biometric auth for Next.js. One command, zero passwords.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://www.npmjs.com/package/next-webauthn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-fp hover:bg-fp-light transition-colors rounded-lg px-8 py-4 text-white font-semibold"
          >
            Get Started
          </a>
          <a
            href="https://github.com/aneeshg-zeto/auth-fpv"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-border hover:border-fp transition-colors rounded-lg px-8 py-4 font-semibold"
          >
            View on GitHub
          </a>
        </div>
        <div className="mt-24 flex justify-center">
          <FingerprintSVG size={120} className="text-fp animate-pulse-slow" />
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      title: 'Zero-config setup',
      description:
        'One command: npx next-webauthn init. It creates your API routes, middleware, and env file. No boilerplate to write.',
    },
    {
      title: 'One-tap login',
      description:
        'Usernameless passkey login with AutoFillPasskeyButton. Touch ID or Face ID, one tap, signed in. No username needed.',
    },
    {
      title: 'Built on WebAuthn',
      description:
        'The standard trusted by Apple, Google, and Microsoft. Your users\' biometrics never leave their device.',
    },
    {
      title: 'One-line middleware',
      description:
        'Protect routes instantly. Add createWebAuthnMiddleware to your middleware.ts and done. Rate limiting built in.',
    },
    {
      title: 'Extensible storage',
      description:
        'Adapter pattern with default SQLite. Swap in your own database by implementing a 12-method interface.',
    },
    {
      title: 'Privacy first',
      description:
        'All data in your SQLite database. Zero browser storage, zero third-party services. HttpOnly session cookies.',
    },
  ]

  return (
    <section className="bg-surface-2 py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-center">
          Why next-webauthn?
        </h2>
        <p className="text-muted text-center max-w-xl mx-auto mb-16">
          Three steps. No passwords. Production auth for any Next.js app.
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <FingerprintSVG size={20} className="text-fp mt-1 shrink-0" />
              <div>
                <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DemoSVG() {
  return (
    <svg
      width={200}
      height={200}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-fp"
    >
      <path d="M24 8a10 10 0 0 0-10 10c0 2.5.8 4.8 2.2 6.7" />
      <path d="M24 8a10 10 0 0 1 10 10c0 2.5-.8 4.8-2.2 6.7" />
      <path d="M24 16a5 5 0 0 0-5 5c0 1.5.6 2.8 1.6 3.8" />
      <path d="M24 16a5 5 0 0 1 5 5c0 1.5-.6 2.8-1.6 3.8" />
      <path d="M24 22a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0v-6a2 2 0 0 0-2-2z" />
      <path d="M16 18.5A8 8 0 0 0 12 24c0 3.2 2 6 4.8 7.2" />
      <path d="M32 18.5A8 8 0 0 1 36 24c0 3.2-2 6-4.8 7.2" />
      <path d="M18 27.5A5 5 0 0 0 16 30c0 1.7 1 3.2 2.5 3.9" />
      <path d="M30 27.5A5 5 0 0 1 32 30c0 1.7-1 3.2-2.5 3.9" />
      <path d="M20 33.5A3 3 0 0 0 18 36c0 1 .5 1.8 1.2 2.4" />
      <path d="M28 33.5A3 3 0 0 1 30 36c0 1-.5 1.8-1.2 2.4" />
      <path d="M22 38.5A1 1 0 0 0 21 40c0 .3.2.5.5.7" />
      <path d="M26 38.5A1 1 0 0 1 27 40c0 .3-.2.5-.5.7" />
      <path d="M24 35a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0v-4a3 3 0 0 0-3-3z" />
    </svg>
  )
}

function DemoSection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <div className="relative inline-flex items-center justify-center border border-border rounded-2xl p-16 bg-surface-2 overflow-hidden">
          <div className="relative">
            <DemoSVG />
            <div className="absolute left-0 right-0 h-0.5 bg-fp/40 animate-scan-line" />
          </div>
        </div>
        <p className="mt-12 text-2xl md:text-3xl font-bold tracking-tight">
          One interaction. No passwords. Instant login.
        </p>
      </div>
    </section>
  )
}

function TestimonialSection() {
  return (
    <section className="bg-surface-2 py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto text-center relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <FingerprintSVG size={320} className="text-fp opacity-5 animate-spin-slow" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <p className="text-3xl md:text-4xl lg:text-5xl italic font-light leading-snug mb-8">
            &ldquo;Finally, biometric auth that doesn&rsquo;t feel like a science project.&rdquo;
          </p>
          <p className="text-muted text-lg">Aneesh G., Builder</p>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-32 px-6 text-center">
      <div className="max-w-6xl mx-auto">
        <FingerprintSVG size={80} className="text-fp mx-auto mb-8" />
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-10">
          Ready to ditch passwords?
        </h2>
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://www.npmjs.com/package/next-webauthn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-fp hover:bg-fp-light transition-colors rounded-lg px-8 py-4 text-white font-semibold"
          >
            Get Started
          </a>
          <a
            href="https://github.com/aneeshg-zeto/auth-fpv"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-border hover:border-fp transition-colors rounded-lg px-8 py-4 font-semibold"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-sm text-muted">
        <FingerprintSVG size={16} className="text-fp" />
        <span>next-webauthn</span>
        <span>·</span>
        <span>MIT</span>
        <span>·</span>
        <a
          href="https://github.com/aneeshg-zeto/auth-fpv"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-fp transition-colors"
        >
          GitHub
        </a>
        <span>·</span>
        <a
          href="https://www.npmjs.com/package/next-webauthn"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-fp transition-colors"
        >
          NPM
        </a>
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <InstallCmd />
      <DemoSection />
      <TestimonialSection />
      <CTASection />
      <Footer />
    </>
  )
}
