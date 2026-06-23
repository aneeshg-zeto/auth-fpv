import { generateRegistrationOptions, type AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { NextResponse, type NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../config'
import { getAdapter, normalizeBase64URL, toBase64URL, validateInput } from '../auth'
import { createRateLimiter } from '../rate-limit'

const rateLimiter = createRateLimiter()

export function createRegisterBeginHandler(config?: WebAuthnConfig) {
  return async function registerBeginHandler(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config)
    const adapter = getAdapter(resolved)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!rateLimiter.check(ip).allowed) {
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
    let user = adapter.findUserByUsername(username)
    let userId: string
    let existingCredentialIds: string[] = []

    if (user) {
      userId = user.id
      existingCredentialIds = adapter.findPasskeysByUserId(userId).map(
        (passkey) => toBase64URL(passkey.credentialId),
      )
    } else {
      user = adapter.createUser(username)
      userId = user.id
    }

    const options = await generateRegistrationOptions({
      rpName: resolved.rpName,
      rpID: resolved.rpID,
      userID: new TextEncoder().encode(userId),
      userName: username,
      attestationType: 'none',
      excludeCredentials: existingCredentialIds.map((id) => ({ id, transports: [] as AuthenticatorTransportFuture[] })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',
        userVerification: 'required',
      },
    })

    const challengeId = randomUUID()
    const now = Math.floor(Date.now() / 1000)
    adapter.saveChallenge({
      id: challengeId,
      challenge: options.challenge,
      type: 'registration',
      expiresAt: now + resolved.challengeTTL,
      userId,
    })

    return NextResponse.json({ ...options, challengeId })
  }
}
