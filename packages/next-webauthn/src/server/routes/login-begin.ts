import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { NextResponse, type NextRequest } from 'next/server';
import { findPasskeysByUserId, findUserByUsername, saveChallenge } from '../auth';
import { getDb } from '../db';
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../config';

export function createLoginBeginHandler(config?: WebAuthnConfig) {
  return async function loginBeginHandler(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config);
    const db = getDb(resolved);
    const { username } = await req.json();

    if (!username?.trim()) {
      return NextResponse.json({ error: 'username required' }, { status: 400 });
    }

    const user = findUserByUsername(username, { db, config: resolved });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const passkeys = findPasskeysByUserId(user.id, { db, config: resolved });
    if (!passkeys.length) {
      return NextResponse.json({ error: 'No passkeys registered' }, { status: 400 });
    }

    const options = await generateAuthenticationOptions({
      rpID: resolved.rpID,
      userVerification: 'required',
      allowCredentials: passkeys.map((passkey) => ({
        id: passkey.credential_id,
        transports: [],
      })),
    });

    saveChallenge(username, options.challenge, 'authentication', { db, config: resolved });
    return NextResponse.json(options);
  };
}
