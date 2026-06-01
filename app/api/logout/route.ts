import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get('session_id')?.value;
  if (sessionId) deleteSession(sessionId);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('session_id', '', { maxAge: 0, path: '/' });
  return res;
}
