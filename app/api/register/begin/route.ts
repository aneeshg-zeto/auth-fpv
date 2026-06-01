import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { findUserByUsername, findPasskeysByUserId, createUser, saveChallenge } from '@/lib/auth';

const RP_NAME = 'My WebAuthn App';
const RP_ID   = process.env.RP_ID ?? 'localhost';

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username?.trim()) {
    return NextResponse.json({ error: 'username required' }, { status: 400 });
  }

  // Resolve or pre-create user so we can pass existing credential IDs
  let user = findUserByUsername(username);
  let userId: string;
  let existingCredentialIds: string[] = [];

  if (user) {
    userId = user.id;
    existingCredentialIds = findPasskeysByUserId(userId).map(
      (p) => p.credential_id
    );
  } else {
    userId = createUser(username);
  }

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: new TextEncoder().encode(userId),
    userName: username,
    attestationType: 'none',
    excludeCredentials: existingCredentialIds.map((id) => ({ id, transports: [] })),
    authenticatorSelection: {
      authenticatorAttachment: 'platform',   // only biometric / platform authenticators
      residentKey: 'required',
      userVerification: 'required',
    },
  });

  // Persist challenge to DB — NOT to any in-memory Map
  saveChallenge(username, options.challenge, 'registration');

  return NextResponse.json(options);
}