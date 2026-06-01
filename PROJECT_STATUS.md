# WebAuthn Biometric Auth — Complete Build Guide
> **For GitHub Copilot / AI-assisted coding**  
> Stack: Next.js App Router · TypeScript · SQLite (`better-sqlite3`) · `@simplewebauthn/server` + `@simplewebauthn/browser`  
> **Storage rule: ZERO browser/OS storage. All state (challenges, sessions, credentials) lives only in `webauthn.db`.**

---

## 0. Objective & Constraints

Build a working passwordless biometric login system (Touch ID / Face ID / Windows Hello) for a web app.

**Hard constraints:**
- No `localStorage`, `sessionStorage`, `IndexedDB`, cookies with client-set values, or any in-memory module-level Maps used across requests.
- Challenges are written to SQLite immediately and deleted after use.
- Sessions are rows in SQLite; the only thing sent to the browser is an **HttpOnly, Secure, SameSite=Strict** session-ID cookie (value is opaque UUID — no data, just a lookup key).
- No `lib/store.ts` in-memory maps — delete that file entirely.

---

## 1. Clean Slate — Files to Delete

Remove these before starting:

```
my-webauthn-app/lib/store.ts          ← in-memory maps, causes cross-request failures
my-webauthn-app/app/api/login/page.tsx ← stray UI page inside API route folder
```

---

## 2. Database Schema — `lib/db.ts`

Replace the entire file with the schema below. It adds a `challenges` table (was missing) and fixes the `sessions` table to carry the `username` for dashboard display.

```typescript
// lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), '..', 'webauthn.db');

const db = new Database(DB_PATH);

db.exec(`
  PRAGMA journal_mode=WAL;

  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS passkeys (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL,
    public_key    TEXT NOT NULL,
    counter       INTEGER NOT NULL DEFAULT 0,
    device_name   TEXT,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    last_used     INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Temporary challenge store: one row per pending ceremony
  -- Keyed by username; deleted immediately after verification
  CREATE TABLE IF NOT EXISTS challenges (
    username    TEXT PRIMARY KEY,
    challenge   TEXT NOT NULL,
    type        TEXT NOT NULL CHECK(type IN ('registration','authentication')),
    expires_at  INTEGER NOT NULL
  );

  -- Session tokens: only the cookie value (session_id) is sent to browser
  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username    TEXT NOT NULL,
    expires_at  INTEGER NOT NULL
  );
`);

export default db;
```

---

## 3. Helper — `lib/auth.ts` (new file)

Centralises all DB operations so route handlers stay thin.

```typescript
// lib/auth.ts
import db from './db';
import { randomUUID } from 'crypto';

const CHALLENGE_TTL_SECONDS = 120;   // 2 minutes
const SESSION_TTL_SECONDS   = 60 * 60 * 8; // 8 hours

// ── Challenges ────────────────────────────────────────────────────────────────

export function saveChallenge(
  username: string,
  challenge: string,
  type: 'registration' | 'authentication'
) {
  const expires_at = Math.floor(Date.now() / 1000) + CHALLENGE_TTL_SECONDS;
  db.prepare(`
    INSERT INTO challenges (username, challenge, type, expires_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET challenge=excluded.challenge,
      type=excluded.type, expires_at=excluded.expires_at
  `).run(username, challenge, type, expires_at);
}

export function consumeChallenge(
  username: string,
  type: 'registration' | 'authentication'
): string | null {
  // Purge expired rows first
  db.prepare(`DELETE FROM challenges WHERE expires_at < unixepoch()`).run();

  const row = db.prepare<{ challenge: string }, [string, string]>(
    `SELECT challenge FROM challenges WHERE username = ? AND type = ?`
  ).get(username, type) as { challenge: string } | undefined;

  if (!row) return null;

  // Delete immediately — one-time use
  db.prepare(`DELETE FROM challenges WHERE username = ?`).run(username);

  return row.challenge;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function findUserByUsername(username: string) {
  return db.prepare(`SELECT * FROM users WHERE username = ?`).get(username) as
    | { id: string; username: string; created_at: number }
    | undefined;
}

export function createUser(username: string) {
  const id = randomUUID();
  db.prepare(`INSERT INTO users (id, username) VALUES (?, ?)`).run(id, username);
  return id;
}

// ── Passkeys ──────────────────────────────────────────────────────────────────

export function savePasskey(params: {
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceName?: string;
}) {
  db.prepare(`
    INSERT INTO passkeys (id, user_id, credential_id, public_key, counter, device_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    params.userId,
    params.credentialId,
    params.publicKey,
    params.counter,
    params.deviceName ?? null
  );
}

export function findPasskeyByCredentialId(credentialId: string) {
  return db.prepare(`SELECT * FROM passkeys WHERE credential_id = ?`).get(credentialId) as
    | { id: string; user_id: string; credential_id: string; public_key: string; counter: number }
    | undefined;
}

export function findPasskeysByUserId(userId: string) {
  return db.prepare(`SELECT * FROM passkeys WHERE user_id = ?`).all(userId) as
    { id: string; credential_id: string; public_key: string; counter: number; device_name: string }[];
}

export function updatePasskeyCounter(credentialId: string, counter: number) {
  db.prepare(`UPDATE passkeys SET counter = ?, last_used = unixepoch() WHERE credential_id = ?`)
    .run(counter, credentialId);
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export function createSession(userId: string, username: string): string {
  const id = randomUUID();
  const expires_at = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  db.prepare(`INSERT INTO sessions (id, user_id, username, expires_at) VALUES (?, ?, ?, ?)`)
    .run(id, userId, username, expires_at);
  return id;
}

export function getSession(sessionId: string) {
  db.prepare(`DELETE FROM sessions WHERE expires_at < unixepoch()`).run(); // housekeeping
  return db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId) as
    | { id: string; user_id: string; username: string; expires_at: number }
    | undefined;
}

export function deleteSession(sessionId: string) {
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
}
```

---

## 4. Route Handlers

### 4.1 `app/api/register/begin/route.ts`

```typescript
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
  let existingCredentialIds: Uint8Array[] = [];

  if (user) {
    userId = user.id;
    existingCredentialIds = findPasskeysByUserId(userId).map(
      (p) => new Uint8Array(Buffer.from(p.credential_id, 'base64url'))
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
```

### 4.2 `app/api/register/finish/route.ts`

```typescript
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
```

### 4.3 `app/api/login/begin/route.ts`

```typescript
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
      id: new Uint8Array(Buffer.from(p.credential_id, 'base64url')),
      transports: [],
    })),
  });

  // Persist challenge to DB — same table, same helper
  saveChallenge(username, options.challenge, 'authentication');

  return NextResponse.json(options);
}
```

### 4.4 `app/api/login/finish/route.ts`

```typescript
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
        id: new Uint8Array(Buffer.from(passkey.credential_id, 'base64url')),
        publicKey: new Uint8Array(Buffer.from(passkey.public_key, 'base64url')),
        counter: passkey.counter,
        transports: [],
      },
    });
  } catch (err) {
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
```

### 4.5 `app/api/logout/route.ts` (new)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get('session_id')?.value;
  if (sessionId) deleteSession(sessionId);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('session_id', '', { maxAge: 0, path: '/' });
  return res;
}
```

### 4.6 `app/api/me/route.ts` (new — used by dashboard)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get('session_id')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const session = getSession(sessionId);
  if (!session) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  return NextResponse.json({ userId: session.user_id, username: session.username });
}
```

---

## 5. Middleware — `middleware.ts` (root of project)

Protects `/dashboard` at the edge without touching any browser storage.

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/dashboard'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (isProtected && !req.cookies.get('session_id')?.value) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };
```

---

## 6. Client Pages

### 6.1 `app/register/page.tsx`

```tsx
'use client';
import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');

  async function handleRegister() {
    if (!username.trim()) return setStatus('Enter a username.');
    setStatus('Starting registration…');
    try {
      const opts = await fetch('/api/register/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      }).then((r) => r.json());

      if (opts.error) return setStatus(`Error: ${opts.error}`);

      // Browser shows biometric prompt here (Touch ID / Windows Hello)
      const credential = await startRegistration({ optionsJSON: opts });

      const result = await fetch('/api/register/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, credential }),
      }).then((r) => r.json());

      if (result.verified) {
        setStatus('Registered! Redirecting to login…');
        setTimeout(() => router.push('/login'), 1200);
      } else {
        setStatus(`Failed: ${result.error}`);
      }
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Create Account</h1>
      <input
        className="border rounded px-3 py-2 w-72"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
      />
      <button
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        onClick={handleRegister}
      >
        Register with Biometrics
      </button>
      {status && <p className="text-sm text-gray-600">{status}</p>}
      <a href="/login" className="text-blue-500 text-sm underline">Already have an account? Log in</a>
    </main>
  );
}
```

### 6.2 `app/login/page.tsx`

```tsx
'use client';
import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');

  async function handleLogin() {
    if (!username.trim()) return setStatus('Enter your username.');
    setStatus('Waiting for biometric prompt…');
    try {
      const opts = await fetch('/api/login/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      }).then((r) => r.json());

      if (opts.error) return setStatus(`Error: ${opts.error}`);

      const credential = await startAuthentication({ optionsJSON: opts });

      const result = await fetch('/api/login/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, credential }),
      }).then((r) => r.json());

      if (result.verified) {
        setStatus('Logged in! Redirecting…');
        router.push('/dashboard');
      } else {
        setStatus(`Failed: ${result.error}`);
      }
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Sign In</h1>
      <input
        className="border rounded px-3 py-2 w-72"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
      />
      <button
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        onClick={handleLogin}
      >
        Sign In with Biometrics
      </button>
      {status && <p className="text-sm text-gray-600">{status}</p>}
      <a href="/register" className="text-blue-500 text-sm underline">New here? Create account</a>
    </main>
  );
}
```

### 6.3 `app/dashboard/page.tsx`

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; userId: string } | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setUser)
      .catch(() => router.push('/login'));
  }, [router]);

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  if (!user) return <p className="p-8 text-gray-400">Loading…</p>;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Welcome, {user.username} 👋</h1>
      <p className="text-gray-500 text-sm">Authenticated via biometrics. No passwords used.</p>
      <button
        className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
        onClick={handleLogout}
      >
        Log Out
      </button>
    </main>
  );
}
```

---

## 7. Environment Variables — `.env.local`

```env
# Must match the domain your app runs on (no port, no protocol)
RP_ID=localhost

# Full origin including protocol and port
ORIGIN=http://localhost:3000

# For production:
# RP_ID=yourdomain.com
# ORIGIN=https://yourdomain.com
```

---

## 8. `next.config.ts` — ensure no accidental client bundling of `better-sqlite3`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
```

---

## 9. Final File Structure After Changes

```
my-webauthn-app/
├── middleware.ts                        ← NEW: protects /dashboard
├── .env.local                           ← NEW: RP_ID + ORIGIN
├── next.config.ts                       ← UPDATED: serverExternalPackages
├── app/
│   ├── api/
│   │   ├── login/
│   │   │   ├── begin/route.ts          ← REWRITTEN
│   │   │   └── finish/route.ts         ← REWRITTEN (reads from DB, not store.ts)
│   │   ├── register/
│   │   │   ├── begin/route.ts          ← REWRITTEN
│   │   │   └── finish/route.ts         ← REWRITTEN
│   │   ├── logout/route.ts             ← NEW
│   │   └── me/route.ts                 ← NEW
│   ├── dashboard/page.tsx              ← REWRITTEN
│   ├── login/page.tsx                  ← REWRITTEN
│   ├── register/page.tsx               ← REWRITTEN
│   └── ...
├── lib/
│   ├── db.ts                           ← REWRITTEN (adds challenges table)
│   └── auth.ts                         ← NEW: all DB helpers
```

**Delete permanently:**
- `lib/store.ts`
- `app/api/login/page.tsx`

---

## 10. Data Flow Summary

```
REGISTRATION
  Browser  →  POST /api/register/begin  {username}
  Server   →  generateRegistrationOptions()  →  saves challenge to challenges table  →  returns options JSON
  Browser  →  startRegistration(options)  →  Touch ID / Face ID prompt
  Browser  →  POST /api/register/finish  {username, credential}
  Server   →  consumeChallenge() [deletes from DB]  →  verifyRegistrationResponse()  →  savePasskey()
  Browser  ←  { verified: true }

AUTHENTICATION
  Browser  →  POST /api/login/begin  {username}
  Server   →  generateAuthenticationOptions()  →  saves challenge to challenges table  →  returns options JSON
  Browser  →  startAuthentication(options)  →  Touch ID / Face ID prompt
  Browser  →  POST /api/login/finish  {username, credential}
  Server   →  consumeChallenge() [deletes from DB]  →  findPasskeyByCredentialId() [from DB]
           →  verifyAuthenticationResponse()  →  updatePasskeyCounter()  →  createSession()
           →  Set-Cookie: session_id=<uuid>; HttpOnly; Secure; SameSite=Strict
  Browser  ←  { verified: true }  +  cookie

PROTECTED ROUTE (/dashboard)
  Browser  →  GET /dashboard  (sends cookie automatically)
  Middleware  →  reads session_id cookie  →  if absent, redirect to /login
  Server   →  GET /api/me  →  getSession(session_id)  →  returns {username, userId}
```

---

## 11. What Is and Is Not Stored in the Browser

| Item | Where | Accessible by JS? |
|---|---|---|
| Session ID | HttpOnly cookie | ❌ No |
| Challenge | SQLite `challenges` table only | ❌ No |
| Public key / credential | SQLite `passkeys` table only | ❌ No |
| User data | SQLite `users` table only | ❌ No |
| `localStorage` / `sessionStorage` | **Nothing stored** | — |
| In-memory Maps | **None** | — |

---

## 12. Checklist Before Testing

- [ ] Deleted `lib/store.ts`
- [ ] Deleted `app/api/login/page.tsx`
- [ ] `lib/db.ts` has all 4 tables: `users`, `passkeys`, `challenges`, `sessions`
- [ ] `lib/auth.ts` exists and is the single source for all DB reads/writes
- [ ] All 4 route handlers import from `lib/auth.ts` only
- [ ] `.env.local` has `RP_ID` and `ORIGIN`
- [ ] `next.config.ts` has `serverExternalPackages: ['better-sqlite3']`
- [ ] `middleware.ts` is at project root (same level as `app/`)
- [ ] Running on HTTPS or `localhost` (WebAuthn is origin-locked — won't work on `127.0.0.1` vs `localhost`)