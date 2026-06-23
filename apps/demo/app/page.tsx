export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface text-white">
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-32">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-12">
            <span className="inline-flex items-center gap-2 text-sm text-muted border border-border rounded-full px-4 py-1.5">
              next-webauthn · Passkey Auth for Next.js
            </span>
          </div>
          <h1 className="tracking-tight font-bold text-6xl md:text-7xl leading-none mb-8">
            Login with a touch.
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-12">
            Drop-in biometric auth for Next.js. One command, zero passwords.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
    </main>
  )
}
