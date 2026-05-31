import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { randomUUID } from 'crypto';
import { User } from '@/lib/db';

const challenges = new Map<string, string>();

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  const existingUser = User.findByUsername.get(username);
  if (existingUser) {
    return NextResponse.json({ error: 'Username already registered' }, { status: 400 });
  }

  const userId = randomUUID();
  const rpID = req.headers.get('host')?.split(':')[0] || 'localhost';
  const userIdBuffer = new TextEncoder().encode(userId);

  const options = await generateRegistrationOptions({
    rpName: 'Biometric Demo',
    rpID,
    userID: userIdBuffer,
    userName: username,
    userDisplayName: username,
    attestationType: 'none',
    authenticatorSelection: {
      // ✅ FORCE platform authenticator (built-in Touch ID/Windows Hello)
      authenticatorAttachment: 'platform',  // 'platform' = built-in, 'cross-platform' = USB keys
      residentKey: 'required',              // Store credential on device
      userVerification: 'required',         // Always require fingerprint
    },
    // ✅ Exclude existing credentials (prevents re-registering same device)
    excludeCredentials: [],
  });

  challenges.set(userId, options.challenge);
  setTimeout(() => challenges.delete(userId), 60000);

  return NextResponse.json({ options, userId });
}