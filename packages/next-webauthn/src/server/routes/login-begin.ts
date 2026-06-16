import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { NextResponse, type NextRequest } from 'next/server'
import { findPasskeysByUserId, findUserByUsername, rateLimit, saveChallenge, validateInput } from '../auth'
import { getDb } from '../db'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../../config'

export function createLoginBeginHandler(config?: WebAuthnConfig) {
  return async function loginBeginHandler(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config)
    const db = getDb(resolved)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!rateLimit(ip, 'login-begin', 10, { db, config: resolved }).allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validationError = validateInput(body, {
      username: { type: 'string', required: true },
    })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const { username } = body as { username: string }
    const user = findUserByUsername(username, { db, config: resolved })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const passkeys = findPasskeysByUserId(user.id, { db, config: resolved })
    if (!passkeys.length) {
      return NextResponse.json({ needsRegistration: true, username })
    }

    const options = await generateAuthenticationOptions({
      rpID: resolved.rpID,
      userVerification: 'required',
    })

    saveChallenge(user.id, options.challenge, 'authentication', { db, config: resolved })
    return NextResponse.json(options)
  }
}
