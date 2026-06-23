'use client'

import { useState } from 'react'

export function InstallCmd() {
  const [copied, setCopied] = useState(false)

  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-sm text-muted uppercase tracking-widest mb-4">Install</p>
        <div className="inline-flex items-center gap-0 border border-border rounded-xl overflow-hidden">
          <code className="px-6 py-4 text-sm font-mono text-fp bg-surface-2 border-r border-border">
            npm install next-webauthn
          </code>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText('npm install next-webauthn')
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="px-5 py-4 text-sm font-medium text-muted hover:text-white hover:bg-fp transition"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </section>
  )
}
