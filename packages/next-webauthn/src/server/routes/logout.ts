import { NextResponse, type NextRequest } from 'next/server'
import { deleteSession } from '../auth'
import { getDb } from '../db'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../../config'

export function createLogoutHandler(config?: WebAuthnConfig) {
  return async function logoutHandler(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config)
    const db = getDb(resolved)
    const sessionId = req.cookies.get(resolved.cookieName)?.value
    if (sessionId) {
      deleteSession(sessionId, { db, config: resolved })
    }
    const response = NextResponse.json({ ok: true })
    response.cookies.set(resolved.cookieName, '', {
      ...resolved.cookieOptions,
      maxAge: 0,
    })
    return response
  }
}
