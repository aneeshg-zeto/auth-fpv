import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "next-webauthn — Passkey Auth for Next.js. For Mac.",
  description:
    "Drop-in passkey authentication for Next.js. One command and your users sign in with Touch ID or Face ID. For Mac.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
