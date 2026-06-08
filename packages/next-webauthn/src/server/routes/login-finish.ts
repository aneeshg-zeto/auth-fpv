import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { NextResponse, type NextRequest } from 'next/server';
import {
  consumeChallenge,
  createSession,
  findPasskeyByCredentialId,
  findUserByUsername,
  updatePasskeyCounter,
} from '../auth';
import { getDb } from '../db';
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../config';

export function createLoginFinishHandler(config?: WebAuthnConfig) {
  return async function loginFinishHandler(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config);
    const db = getDb(resolved);
    const { username, credential } = await req.json();

    if (!username || !credential) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    const user = findUserByUsername(username, { db, config: resolved });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const expectedChallenge = consumeChallenge(username, 'authentication', { db, config: resolved });
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
    }

    const rawId = credential.rawId ?? credential.id;
    const passkey = findPasskeyByCredentialId(rawId, { db, config: resolved });
    if (!passkey) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: resolved.origin,
        expectedRPID: resolved.rpID,
        requireUserVerification: true,
        credential: {
          id: passkey.credential_id,
          publicKey: new Uint8Array(Buffer.from(passkey.public_key, 'base64url')),
          counter: passkey.counter,
          transports: [],
        },
      });

      if (!verification.verified) {
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
      }

      updatePasskeyCounter(passkey.credential_id, verification.authenticationInfo.newCounter, {
        db,
        config: resolved,
      });

      const sessionId = createSession(user.id, user.username, { db, config: resolved });
      const response = NextResponse.json({ verified: true });
      response.cookies.set(resolved.cookieName, sessionId, {
        ...resolved.cookieOptions,
        maxAge: resolved.sessionMaxAge,
      });
      return response;
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
  };
}
