import { verifyAuthenticationResponse, type AuthenticationResponseJSON } from '@simplewebauthn/server'
import { NextResponse, type NextRequest } from 'next/server'
import {
  consumeChallenge,
  createSession,
  findPasskeyByCredentialId,
  findUserById,
  normalizeBase64URL,
  rateLimit,
  updatePasskeyCounter,
  validateInput,
} from '../auth'
import { getDb } from '../db'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../../config'

export function createLoginFinishHandler(config?: WebAuthnConfig) {
  return async function loginFinishHandler(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config)
    const db = getDb(resolved)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!rateLimit(ip, 'login-finish', 10, { db, config: resolved }).allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validationError = validateInput(body, {
      credential: { type: 'object', required: true },
    })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const credential = (body as Record<string, unknown>).credential as unknown as AuthenticationResponseJSON
    if (!credential.id || !credential.rawId || !credential.response || !credential.type) {
      return NextResponse.json({ error: 'Invalid credential format' }, { status: 400 })
    }

    const credentialIdFromBrowser = normalizeBase64URL(credential.rawId as string)
    let passkey = findPasskeyByCredentialId(credentialIdFromBrowser, { db, config: resolved })

    if (!passkey && credential.id) {
      const altId = normalizeBase64URL(credential.id as string)
      if (altId !== credentialIdFromBrowser) {
        passkey = findPasskeyByCredentialId(altId, { db, config: resolved })
      }
    }

    if (!passkey) {
      const userHandle = credential.response?.userHandle
      if (userHandle) {
        let userId: string | null = null
        try {
          userId = Buffer.from(userHandle, 'base64url').toString('utf-8')
        } catch {
          userId = null
        }
        if (userId) {
          const user = findUserById(userId, { db, config: resolved })
          if (user) {
            return NextResponse.json(
              { error: 'Passkey outdated. Please re-register.', hint: 'reregister' },
              { status: 404 },
            )
          }
        }
      }
      return NextResponse.json(
        { error: 'Passkey not found. It may be stale — delete it from System Settings → Passwords and re-register.', hint: 'stale_credential' },
        { status: 404 },
      )
    }

    const expectedChallenge = consumeChallenge(passkey.user_id, 'authentication', { db, config: resolved })
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 })
    }

    const user = findUserById(passkey.user_id, { db, config: resolved })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    try {
      const origin = req.headers.get('origin') ?? resolved.origin

      const verification = await verifyAuthenticationResponse({
        response: credential as AuthenticationResponseJSON,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: resolved.rpID,
        requireUserVerification: true,
        credential: {
          id: passkey.credential_id,
          publicKey: new Uint8Array(Buffer.from(passkey.public_key, 'base64url')),
          counter: passkey.counter,
          transports: [],
        },
      })

      if (!verification.verified) {
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
      }

      updatePasskeyCounter(passkey.credential_id, verification.authenticationInfo.newCounter, {
        db,
        config: resolved,
      })

      const sessionId = createSession(user.id, user.username, { db, config: resolved })
      const response = NextResponse.json({ verified: true })
      response.cookies.set(resolved.cookieName, sessionId, {
        ...resolved.cookieOptions,
        maxAge: resolved.sessionMaxAge,
      })
      return response
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
  }
}
