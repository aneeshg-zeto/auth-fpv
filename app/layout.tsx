import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "next-webauthn — Biometric Auth for Next.js",
  description:
    "Drop-in biometric authentication for Next.js. One command and your users sign in with fingerprint or Face ID. No passwords, no hassle.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
