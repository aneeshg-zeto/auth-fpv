import { verifyAuthenticationResponse, type AuthenticationResponseJSON } from '@simplewebauthn/server'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../config'
import { getAdapter, normalizeBase64URL, toBase64URL, validateInput } from '../auth'
import { createRateLimiter } from '../rate-limit'

const rateLimiter = createRateLimiter()

export function createLoginFinishHandler(config?: WebAuthnConfig) {
  return async function loginFinishHandler(req: NextRequest) {
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
      credential: { type: 'object', required: true },
      challengeId: { type: 'string', required: true },
    })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const challengeId = body.challengeId as string
    const credential = body.credential as unknown as AuthenticationResponseJSON
    if (!credential.id || !credential.rawId || !credential.response || !credential.type) {
      return NextResponse.json({ error: 'Invalid credential format' }, { status: 400 })
    }

    const challenge = adapter.consumeChallenge(challengeId)
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 })
    }

    const credentialIdFromBrowser = normalizeBase64URL(credential.rawId as string)
    let passkey = adapter.findPasskeyByCredentialId(credentialIdFromBrowser)

    if (!passkey && credential.id) {
      const altId = normalizeBase64URL(credential.id as string)
      if (altId !== credentialIdFromBrowser) {
        passkey = adapter.findPasskeyByCredentialId(altId)
      }
    }

    let user = null

    if (challenge.userId) {
      if (!passkey) {
        return NextResponse.json({ error: 'Passkey not found' }, { status: 404 })
      }
      if (passkey.userId !== challenge.userId) {
        return NextResponse.json({ error: 'Credential does not belong to this user' }, { status: 403 })
      }
      user = adapter.findUserById(challenge.userId)
    } else {
      if (!passkey) {
        const userHandle = credential.response?.userHandle
        if (userHandle) {
          try {
            const decodedUserId = Buffer.from(userHandle, 'base64url').toString('utf-8')
            if (decodedUserId) {
              passkey = adapter.findPasskeysByUserId(decodedUserId)[0] ?? null
            }
          } catch {
            return NextResponse.json({ error: 'Passkey not found' }, { status: 404 })
          }
        }
      }
      if (!passkey) {
        return NextResponse.json({ error: 'Passkey not found' }, { status: 404 })
      }
      user = adapter.findUserById(passkey.userId)
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    try {
      const origin = req.headers.get('origin') ?? resolved.origin

      const verification = await verifyAuthenticationResponse({
        response: credential as AuthenticationResponseJSON,
        expectedChallenge: challenge.challenge,
        expectedOrigin: origin,
        expectedRPID: resolved.rpID,
        requireUserVerification: true,
        credential: {
          id: toBase64URL(passkey.credentialId),
          publicKey: new Uint8Array(Buffer.from(passkey.publicKey, 'base64')),
          counter: passkey.counter,
          transports: [],
        },
      })

      if (!verification.verified) {
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
      }

      adapter.updatePasskeyCounter(passkey.credentialId, verification.authenticationInfo.newCounter)

      const sessionId = adapter.createSession(user.id, user.username, resolved.sessionMaxAge)
      const response = NextResponse.json({ verified: true })
      response.cookies.set(resolved.cookieName, sessionId, {
        ...resolved.cookieOptions,
        maxAge: resolved.sessionMaxAge,
      })

      if (resolved.onLogin) {
        await resolved.onLogin(user, passkey, req)
      }

      return response
    } catch (error) {
      if (resolved.onError) {
        await resolved.onError(error as Error, req)
      }
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
  }
}
