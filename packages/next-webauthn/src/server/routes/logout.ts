import { NextResponse, type NextRequest } from 'next/server'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../config'
import { getAdapter } from '../auth'
import { createRateLimiter } from '../rate-limit'

const rateLimiter = createRateLimiter()

export function createLogoutHandler(config?: WebAuthnConfig) {
  return async function logoutHandler(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config)
    const adapter = getAdapter(resolved)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!rateLimiter.check(ip).allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const sessionId = req.cookies.get(resolved.cookieName)?.value
    if (sessionId) {
      adapter.deleteSession(sessionId)
    }
    const response = NextResponse.json({ ok: true })
    response.cookies.set(resolved.cookieName, '', {
      ...resolved.cookieOptions,
      maxAge: 0,
    })
    return response
  }
}
