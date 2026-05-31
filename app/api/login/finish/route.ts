import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { challenges, users, credentials } from '@/lib/store';

export async function POST(req: NextRequest) {
  const { username, assertionResponse, sessionId } = await req.json();
  if (!username || !assertionResponse || !sessionId) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  const expectedChallenge = challenges.get(sessionId);
  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
  }

  // Find user
  const user = Array.from(users.values()).find(u => u.username === username);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  // Find the credential that was used
  const credentialId = assertionResponse.id;
  const storedCred = credentials.get(credentialId);
  if (!storedCred || storedCred.userId !== user.userId) {
    return NextResponse.json({ error: 'Credential not found for this user' }, { status: 400 });
  }

  const rpID = req.headers.get('host')?.split(':')[0] || 'localhost';
  const origin = `${req.headers.get('x-forwarded-proto') || 'http'}://${rpID}${process.env.NODE_ENV === 'development' ? ':3000' : ''}`;

  // ✅ Convert stored publicKey from base64url string back to Uint8Array
  const publicKeyUint8 = Buffer.from(storedCred.publicKey, 'base64url');

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge,
      expectedRPID: rpID,
      expectedOrigin: origin,
      credential: {
        id: credentialId,
        publicKey: publicKeyUint8,  // ✅ Now this is Uint8Array
        counter: storedCred.counter,
        transports: [],
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Verification failed: ' + String(err) }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: 'Invalid assertion' }, { status: 400 });
  }

  // Update counter
  if (verification.authenticationInfo) {
    storedCred.counter = verification.authenticationInfo.newCounter;
  }

  // Remove challenge
  challenges.delete(sessionId);

  // Set a session cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set('demo_user', username, {
    httpOnly: false,
    path: '/',
    maxAge: 60 * 60 * 24
  });
  return response;
}