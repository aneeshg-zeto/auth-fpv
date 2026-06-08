import { generateRegistrationOptions } from '@simplewebauthn/server';
import { NextResponse, type NextRequest } from 'next/server';
import { createUser, findPasskeysByUserId, findUserByUsername, saveChallenge } from '../auth';
import { getDb } from '../db';
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../config';

export function createRegisterBeginHandler(config?: WebAuthnConfig) {
  return async function registerBeginHandler(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config);
    const db = getDb(resolved);
    const { username } = await req.json();

    if (!username?.trim()) {
      return NextResponse.json({ error: 'username required' }, { status: 400 });
    }

    let user = findUserByUsername(username, { db, config: resolved });
    let userId: string;
    let existingCredentialIds: string[] = [];

    if (user) {
      userId = user.id;
      existingCredentialIds = findPasskeysByUserId(userId, { db, config: resolved }).map(
        (passkey) => passkey.credential_id,
      );
    } else {
      userId = createUser(username, { db, config: resolved });
      user = findUserByUsername(username, { db, config: resolved });
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
    });

    saveChallenge(username, options.challenge, 'registration', { db, config: resolved });
    return NextResponse.json(options);
  };
}
