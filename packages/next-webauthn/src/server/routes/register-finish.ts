import { verifyRegistrationResponse, type RegistrationResponseJSON } from '@simplewebauthn/server'
import { NextResponse, type NextRequest } from 'next/server'
import { consumeChallenge, findUserByUsername, normalizeBase64URL, rateLimit, savePasskey, validateInput } from '../auth'
import { getDb } from '../db'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../../config'

export function createRegisterFinishHandler(config?: WebAuthnConfig) {
  return async function registerFinishHandler(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config)
    const db = getDb(resolved)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!rateLimit(ip, 'register-finish', 5, { db, config: resolved }).allowed) {
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
      credential: { type: 'object', required: true },
    })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const { username } = body as { username: string }
    const credential = (body as Record<string, unknown>).credential as unknown as RegistrationResponseJSON
    if (!credential.id || !credential.rawId || !credential.response || !credential.type) {
      return NextResponse.json({ error: 'Invalid credential format' }, { status: 400 })
    }

    const user = findUserByUsername(username, { db, config: resolved })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const expectedChallenge = consumeChallenge(username, 'registration', { db, config: resolved })
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 })
    }

    try {
      const origin = req.headers.get('origin') ?? resolved.origin

      const verification = await verifyRegistrationResponse({
        response: credential as RegistrationResponseJSON,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: resolved.rpID,
        requireUserVerification: true,
      })

      if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
      }

      const { credential: cred } = verification.registrationInfo
      const credentialId = normalizeBase64URL(cred.id)
      const publicKey = Buffer.from(cred.publicKey).toString('base64url')
      const counter = cred.counter

      savePasskey(
        { userId: user.id, credentialId, publicKey, counter },
        { db, config: resolved },
      )

      return NextResponse.json({ verified: true })
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
  }
}
