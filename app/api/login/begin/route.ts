import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { randomUUID } from 'crypto';
import { User } from '@/lib/db';

const challenges = new Map<string, string>();

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }

  const user = User.findByUsername.get(username) as { id: string; username: string } | undefined;
  if (!user) {
    return NextResponse.json({ error: 'User not found. Please register first.' }, { status: 400 });
  }

  const rpID = req.headers.get('host')?.split(':')[0] || 'localhost';
  
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',  // ✅ Force fingerprint verification
    // Don't specify allowCredentials - let browser show all credentials for this RP
  });

  const sessionId = randomUUID();
  challenges.set(sessionId, options.challenge);
  setTimeout(() => challenges.delete(sessionId), 60000);

  return NextResponse.json({ options, sessionId });
}