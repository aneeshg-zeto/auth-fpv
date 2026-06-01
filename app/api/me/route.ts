import { NextRequest, NextResponse } from 'next/server';
import { getSession, findPasskeysByUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get('session_id')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const session = getSession(sessionId);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  // Load passkeys to find active device name
  const passkeys = findPasskeysByUserId(session.user_id);
  const deviceNames = passkeys.map((p) => p.device_name || 'Biometric Key').filter(Boolean);

  return NextResponse.json({
    userId: session.user_id,
    username: session.username,
    expiresAt: session.expires_at,
    devices: deviceNames,
  });
}
