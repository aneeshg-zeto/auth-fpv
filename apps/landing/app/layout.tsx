import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'next-webauthn — Passkey Auth for Next.js',
  description:
    'Drop-in biometric authentication for Next.js App Router. One command, zero passwords. Touch ID, Face ID, passkeys.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-surface text-[#ededed]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-['Inter'] antialiased">{children}</body>
    </html>
  )
}
