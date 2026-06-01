import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { findUserByUsername, findPasskeysByUserId, saveChallenge } from '@/lib/auth';

const RP_ID = process.env.RP_ID ?? 'localhost';

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username?.trim()) {
    return NextResponse.json({ error: 'username required' }, { status: 400 });
  }

  const user = findUserByUsername(username);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const passkeys = findPasskeysByUserId(user.id);
  if (!passkeys.length) {
    return NextResponse.json({ error: 'No passkeys registered' }, { status: 400 });
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: 'required',
    allowCredentials: passkeys.map((p) => ({
      id: p.credential_id,
      transports: [],
    })),
  });

  // Persist challenge to DB — same table, same helper
  saveChallenge(username, options.challenge, 'authentication');

  return NextResponse.json(options);
}