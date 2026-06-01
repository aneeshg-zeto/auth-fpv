import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import {
  findUserByUsername,
  consumeChallenge,
  findPasskeyByCredentialId,
  updatePasskeyCounter,
  createSession,
} from '@/lib/auth';

const RP_ID  = process.env.RP_ID  ?? 'localhost';
const ORIGIN = process.env.ORIGIN ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const { username, credential } = await req.json();
  if (!username || !credential) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const user = findUserByUsername(username);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const expectedChallenge = consumeChallenge(username, 'authentication');
  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
  }

  // Look up the specific passkey being used (from DB, never from memory)
  const rawId: string = credential.rawId ?? credential.id;
  const passkey = findPasskeyByCredentialId(rawId);
  if (!passkey) return NextResponse.json({ error: 'Credential not found' }, { status: 404 });

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
      credential: {
        id: passkey.credential_id,
        publicKey: new Uint8Array(Buffer.from(passkey.public_key, 'base64url')),
        counter: passkey.counter,
        transports: [],
      },
    });
  } catch (err) {
    console.error('verifyAuthenticationResponse error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  // Update replay-attack counter in DB
  updatePasskeyCounter(passkey.credential_id, verification.authenticationInfo.newCounter);

  // Create session in DB; send only the opaque ID as HttpOnly cookie
  const sessionId = createSession(user.id, user.username);

  const response = NextResponse.json({ verified: true });
  response.cookies.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return response;
}