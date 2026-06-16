import { NextResponse, type NextRequest } from 'next/server'
import { findPasskeysByUserId, getSession } from '../auth'
import { getDb } from '../db'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../../config'

export function createMeHandler(config?: WebAuthnConfig) {
  return async function meHandler(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config)
    const db = getDb(resolved)
    const sessionId = req.cookies.get(resolved.cookieName)?.value
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const session = getSession(sessionId, { db, config: resolved })
    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }
    const passkeys = findPasskeysByUserId(session.user_id, { db, config: resolved })
    const devices = passkeys.map((passkey) => passkey.device_name || 'Biometric Key').filter(Boolean)
    return NextResponse.json({
      userId: session.user_id,
      username: session.username,
      expiresAt: session.expires_at,
      devices,
    })
  }
}
