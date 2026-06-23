import { NextResponse, type NextRequest } from 'next/server'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../config'
import { getAdapter } from '../auth'
import { createRateLimiter } from '../rate-limit'

const rateLimiter = createRateLimiter()

export function createMeHandler(config?: WebAuthnConfig) {
  return async function meHandler(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config)
    const adapter = getAdapter(resolved)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!rateLimiter.check(ip).allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const sessionId = req.cookies.get(resolved.cookieName)?.value
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const session = adapter.getSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }
    const passkeys = adapter.findPasskeysByUserId(session.userId)
    const devices = passkeys.map((passkey) => passkey.deviceName ?? 'Biometric Key').filter(Boolean)
    return NextResponse.json({
      userId: session.userId,
      username: session.username,
      expiresAt: session.expiresAt,
      devices,
    })
  }
}
