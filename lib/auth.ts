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

  const row = db.prepare(
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
