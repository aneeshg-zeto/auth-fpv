import { generateRegistrationOptions } from '@simplewebauthn/server'
import { NextResponse, type NextRequest } from 'next/server'
import { createUser, findPasskeysByUserId, findUserByUsername, rateLimit, saveChallenge, validateInput } from '../auth'
import { getDb } from '../db'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../../config'

export function createRegisterBeginHandler(config?: WebAuthnConfig) {
  return async function registerBeginHandler(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config)
    const db = getDb(resolved)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!rateLimit(ip, 'register-begin', 5, { db, config: resolved }).allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validationError = validateInput(body, {
      username: { type: 'string', required: true, minLength: 3, maxLength: 64, pattern: /^[a-zA-Z0-9_-]+$/ },
    })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const { username } = body as { username: string }
    let user = findUserByUsername(username, { db, config: resolved })
    let userId: string
    let existingCredentialIds: string[] = []

    if (user) {
      userId = user.id
      existingCredentialIds = findPasskeysByUserId(userId, { db, config: resolved }).map(
        (passkey) => passkey.credential_id,
      )
    } else {
      userId = createUser(username, { db, config: resolved })
      user = findUserByUsername(username, { db, config: resolved })
    }

    const options = await generateRegistrationOptions({
      rpName: resolved.rpName,
      rpID: resolved.rpID,
      userID: new TextEncoder().encode(userId),
      userName: username,
      attestationType: 'none',
      excludeCredentials: existingCredentialIds.map((id) => ({ id, transports: [] })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',
        userVerification: 'required',
      },
    })

    saveChallenge(username, options.challenge, 'registration', { db, config: resolved })
    return NextResponse.json(options)
  }
}
