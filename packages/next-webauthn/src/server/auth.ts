import { randomUUID } from 'node:crypto';
import { getDb, type WebAuthnDb } from './db';
import { resolveWebAuthnConfig, type WebAuthnConfig } from './config';

export interface UserRecord {
  id: string;
  username: string;
  created_at: number;
}

export interface PasskeyRecord {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_name: string | null;
  created_at?: number;
  last_used?: number | null;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  username: string;
  expires_at: number;
}

export type ChallengeType = 'registration' | 'authentication';

function useDb(db?: WebAuthnDb, config?: WebAuthnConfig): WebAuthnDb {
  return db ?? getDb(config);
}

export function saveChallenge(
  username: string,
  challenge: string,
  type: ChallengeType,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
) {
  const db = useDb(options?.db, options?.config);
  const resolved = resolveWebAuthnConfig(options?.config);
  const expiresAt = Math.floor(Date.now() / 1000) + resolved.challengeTTL;

  db.prepare(`
    INSERT INTO challenges (username, challenge, type, expires_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET challenge=excluded.challenge,
      type=excluded.type, expires_at=excluded.expires_at
  `).run(username, challenge, type, expiresAt);
}

export function consumeChallenge(
  username: string,
  type: ChallengeType,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): string | null {
  const db = useDb(options?.db, options?.config);
  db.prepare('DELETE FROM challenges WHERE expires_at < unixepoch()').run();

  const row = db
    .prepare('SELECT challenge FROM challenges WHERE username = ? AND type = ?')
    .get(username, type) as { challenge: string } | undefined;

  if (!row) return null;
  db.prepare('DELETE FROM challenges WHERE username = ?').run(username);
  return row.challenge;
}

export function findUserByUsername(
  username: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): UserRecord | undefined {
  const db = useDb(options?.db, options?.config);
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRecord | undefined;
}

export function createUser(
  username: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): string {
  const db = useDb(options?.db, options?.config);
  const id = randomUUID();
  db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run(id, username);
  return id;
}

export function savePasskey(
  params: {
    userId: string;
    credentialId: string;
    publicKey: string;
    counter: number;
    deviceName?: string;
  },
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
) {
  const db = useDb(options?.db, options?.config);
  db.prepare(`
    INSERT INTO passkeys (id, user_id, credential_id, public_key, counter, device_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    params.userId,
    params.credentialId,
    params.publicKey,
    params.counter,
    params.deviceName ?? null,
  );
}

export function findPasskeyByCredentialId(
  credentialId: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): PasskeyRecord | undefined {
  const db = useDb(options?.db, options?.config);
  return db
    .prepare('SELECT * FROM passkeys WHERE credential_id = ?')
    .get(credentialId) as PasskeyRecord | undefined;
}

export function findPasskeysByUserId(
  userId: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): PasskeyRecord[] {
  const db = useDb(options?.db, options?.config);
  return db.prepare('SELECT * FROM passkeys WHERE user_id = ?').all(userId) as PasskeyRecord[];
}

export function updatePasskeyCounter(
  credentialId: string,
  counter: number,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
) {
  const db = useDb(options?.db, options?.config);
  db.prepare('UPDATE passkeys SET counter = ?, last_used = unixepoch() WHERE credential_id = ?').run(
    counter,
    credentialId,
  );
}

export function createSession(
  userId: string,
  username: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): string {
  const db = useDb(options?.db, options?.config);
  const resolved = resolveWebAuthnConfig(options?.config);
  const id = randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + resolved.sessionMaxAge;

  db.prepare('INSERT INTO sessions (id, user_id, username, expires_at) VALUES (?, ?, ?, ?)').run(
    id,
    userId,
    username,
    expiresAt,
  );

  return id;
}

export function getSession(
  sessionId: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): SessionRecord | undefined {
  const db = useDb(options?.db, options?.config);
  db.prepare('DELETE FROM sessions WHERE expires_at < unixepoch()').run();
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as SessionRecord | undefined;
}

export function deleteSession(
  sessionId: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
) {
  const db = useDb(options?.db, options?.config);
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}
