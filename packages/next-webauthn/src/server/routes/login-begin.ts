import { generateAuthenticationOptions, type AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { NextResponse, type NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../config'
import { getAdapter, toBase64URL, validateInput } from '../auth'
import { createRateLimiter } from '../rate-limit'

const rateLimiter = createRateLimiter()

export function createLoginBeginHandler(config?: WebAuthnConfig) {
  return async function loginBeginHandler(req: NextRequest) {
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

    const isConditional = body.mode === 'conditional'
    let userId: string | null = null
    let allowCredentials: { id: string; transports: string[] }[] = []

    if (!isConditional) {
      const validationError = validateInput(body, {
        username: { type: 'string', required: true },
      })
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }

      const { username } = body as { username: string }
      const user = adapter.findUserByUsername(username)
      if (user) {
        userId = user.id
        const passkeys = adapter.findPasskeysByUserId(userId)
        allowCredentials = passkeys.map((p) => ({ id: toBase64URL(p.credentialId), transports: [] as AuthenticatorTransportFuture[] }))
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: resolved.rpID,
      userVerification: 'required',
      allowCredentials: allowCredentials.length > 0 ? (allowCredentials as { id: string; transports?: AuthenticatorTransportFuture[] }[]) : undefined,
    })

    const challengeId = randomUUID()
    const now = Math.floor(Date.now() / 1000)
    adapter.saveChallenge({
      id: challengeId,
      challenge: options.challenge,
      type: 'authentication',
      expiresAt: now + resolved.challengeTTL,
      userId,
    })

    return NextResponse.json({ ...options, challengeId })
  }
}
