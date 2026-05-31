import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { randomUUID } from 'crypto';
import { User, Passkey } from '@/lib/db';

const challenges = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📥 Received body:', { 
      hasUsername: !!body.username, 
      hasAttestation: !!body.attestationResponse,
      hasUserId: !!body.userId 
    });
    
    const { username, attestationResponse, userId } = body;
    
    if (!username || !attestationResponse || !userId) {
      console.log('❌ Missing data:', { username, userId, hasAttestation: !!attestationResponse });
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const expectedChallenge = challenges.get(userId);
    console.log('🔐 Expected challenge exists:', !!expectedChallenge);
    
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
    }

    const rpID = req.headers.get('host')?.split(':')[0] || 'localhost';
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const origin = `${protocol}://${rpID}${process.env.NODE_ENV === 'development' ? ':3000' : ''}`;
    
    console.log('🌐 Environment:', { rpID, origin, protocol });

    let verification;
    try {
      console.log('🔍 Attempting verification...');
      verification = await verifyRegistrationResponse({
        response: attestationResponse,
        expectedChallenge,
        expectedRPID: rpID,
        expectedOrigin: origin,
      });
      console.log('✅ Verification result:', { 
        verified: verification.verified, 
        hasInfo: !!verification.registrationInfo 
      });
    } catch (err) {
      console.error('❌ Verification error:', err);
      return NextResponse.json({ error: 'Verification failed: ' + String(err) }, { status: 400 });
    }

    if (!verification.verified || !verification.registrationInfo) {
      console.log('❌ Invalid registration response');
      return NextResponse.json({ error: 'Invalid registration response' }, { status: 400 });
    }

    // ✅ FIXED: In v13, credential info is nested differently
    const { credential } = verification.registrationInfo;
    const credentialID = credential.id;
    const credentialPublicKey = credential.publicKey;  // ✅ This is Uint8Array
    const counter = credential.counter;
    
    console.log('🔑 Credential info:', { credentialID, counter, hasPublicKey: !!credentialPublicKey });

    // Convert public key from Uint8Array to base64url for storage
    const publicKeyBase64 = Buffer.from(credentialPublicKey).toString('base64url');

    // Save user to database
    const now = Date.now();
    console.log('💾 Saving user:', { userId, username });
    User.create.run(userId, username, now);

    // Save passkey to database
    console.log('💾 Saving passkey for user:', userId);
    Passkey.create.run(
      randomUUID(),
      userId,
      credentialID,
      publicKeyBase64,
      counter,
      now
    );

    challenges.delete(userId);
    console.log('✅ Registration successful!');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🔥 Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + String(error) }, { status: 500 });
  }
}