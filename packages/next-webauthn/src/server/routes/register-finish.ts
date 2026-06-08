import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { NextResponse, type NextRequest } from 'next/server';
import { consumeChallenge, findUserByUsername, savePasskey } from '../auth';
import { getDb } from '../db';
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../config';

export function createRegisterFinishHandler(config?: WebAuthnConfig) {
  return async function registerFinishHandler(req: NextRequest) {
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

    const expectedChallenge = consumeChallenge(username, 'registration', { db, config: resolved });
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
    }

    try {
      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: resolved.origin,
        expectedRPID: resolved.rpID,
        requireUserVerification: true,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
      }

      const { credential: cred } = verification.registrationInfo;
      savePasskey(
        {
          userId: user.id,
          credentialId: Buffer.from(cred.id).toString('base64url'),
          publicKey: Buffer.from(cred.publicKey).toString('base64url'),
          counter: cred.counter,
        },
        { db, config: resolved },
      );

      return NextResponse.json({ verified: true });
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
  };
}
