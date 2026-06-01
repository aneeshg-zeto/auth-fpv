import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { findUserByUsername, consumeChallenge, savePasskey } from '@/lib/auth';

const RP_ID     = process.env.RP_ID     ?? 'localhost';
const ORIGIN    = process.env.ORIGIN    ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const { username, credential } = await req.json();
  if (!username || !credential) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const user = findUserByUsername(username);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Consume challenge from DB (one-time use)
  const expectedChallenge = consumeChallenge(username, 'registration');
  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });
  } catch (err) {
    console.error('verifyRegistrationResponse error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  const { credential: cred } = verification.registrationInfo;

  savePasskey({
    userId: user.id,
    credentialId: Buffer.from(cred.id).toString('base64url'),
    publicKey: Buffer.from(cred.publicKey).toString('base64url'),
    counter: cred.counter,
  });

  return NextResponse.json({ verified: true });
}