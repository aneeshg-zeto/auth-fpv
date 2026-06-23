import { verifyRegistrationResponse, type RegistrationResponseJSON } from '@simplewebauthn/server'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../config'
import { getAdapter, normalizeBase64URL, validateInput } from '../auth'
import { createRateLimiter } from '../rate-limit'
import type { Passkey } from '../../types'

const rateLimiter = createRateLimiter()

export function createRegisterFinishHandler(config?: WebAuthnConfig) {
  return async function registerFinishHandler(req: NextRequest) {
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
      username: { type: 'string', required: true },
      credential: { type: 'object', required: true },
      challengeId: { type: 'string', required: true },
    })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const { username } = body as { username: string }
    const challengeId = body.challengeId as string
    const credential = body.credential as unknown as RegistrationResponseJSON
    if (!credential.id || !credential.rawId || !credential.response || !credential.type) {
      return NextResponse.json({ error: 'Invalid credential format' }, { status: 400 })
    }

    const user = adapter.findUserByUsername(username)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const challenge = adapter.consumeChallenge(challengeId)
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 })
    }

    try {
      const origin = req.headers.get('origin') ?? resolved.origin

      const verification = await verifyRegistrationResponse({
        response: credential as RegistrationResponseJSON,
        expectedChallenge: challenge.challenge,
        expectedOrigin: origin,
        expectedRPID: resolved.rpID,
        requireUserVerification: true,
      })

      if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
      }

      const { credential: cred } = verification.registrationInfo
      const credentialId = normalizeBase64URL(cred.id)
      const publicKey = Buffer.from(cred.publicKey).toString('base64')
      const counter = cred.counter
      const now = Math.floor(Date.now() / 1000)

      adapter.savePasskey({
        userId: user.id,
        credentialId,
        publicKey,
        counter,
      })

      if (resolved.onRegister) {
        const passkeyInfo: Passkey = {
          id: '',
          userId: user.id,
          credentialId,
          publicKey,
          counter,
          deviceName: null,
          createdAt: now,
          lastUsed: null,
        }
        await resolved.onRegister(user, passkeyInfo, req)
      }

      return NextResponse.json({ verified: true })
    } catch (error) {
      if (resolved.onError) {
        await resolved.onError(error as Error, req)
      }
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
  }
}
