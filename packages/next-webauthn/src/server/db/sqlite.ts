import Database from 'better-sqlite3'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { User, Passkey, Challenge, Session } from '../../types'
import type { Adapter } from './interface'
import { normalizeBase64URL } from '../auth'

const dbCache = new Map<string, Database.Database>()

function mapUser(row: { id: string; username: string; created_at: number }): User {
  return { id: row.id, username: row.username, createdAt: row.created_at }
}

function mapPasskey(row: {
  id: string; user_id: string; credential_id: string; public_key: string
  counter: number; device_name: string | null; created_at: number; last_used: number | null
}): Passkey {
  return {
    id: row.id, userId: row.user_id, credentialId: row.credential_id,
    publicKey: row.public_key, counter: row.counter, deviceName: row.device_name,
    createdAt: row.created_at, lastUsed: row.last_used,
  }
}

function mapChallenge(row: {
  id: string; challenge: string; type: string; expires_at: number; user_id: string | null
}): Challenge {
  return {
    id: row.id, challenge: row.challenge,
    type: row.type as 'registration' | 'authentication',
    expiresAt: row.expires_at, userId: row.user_id,
  }
}

function mapSession(row: { id: string; user_id: string; username: string; expires_at: number }): Session {
  return { id: row.id, userId: row.user_id, username: row.username, expiresAt: row.expires_at }
}

const schema = `
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
    last_used     INTEGER
  );

  CREATE TABLE IF NOT EXISTS challenges (
    id          TEXT PRIMARY KEY,
    challenge   TEXT NOT NULL,
    type        TEXT NOT NULL CHECK(type IN ('registration','authentication')),
    expires_at  INTEGER NOT NULL,
    user_id     TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    username    TEXT NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    expires_at  INTEGER NOT NULL
  );
`

export function createSqliteAdapter(dbPath?: string): Adapter {
  const resolvedPath = path.resolve(dbPath ?? 'webauthn.db')
  let db = dbCache.get(resolvedPath)
  if (!db) {
    db = new Database(resolvedPath)
    db.pragma('journal_mode = WAL')
    db.exec(schema)
    dbCache.set(resolvedPath, db)
  }

  function createUser(username: string): User {
    const id = randomUUID()
    const now = Math.floor(Date.now() / 1000)
    db!.prepare('INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)').run(id, username, now)
    return { id, username, createdAt: now }
  }

  function findUserByUsername(username: string): User | null {
    const row = db!.prepare('SELECT * FROM users WHERE username = ?').get(username) as Record<string, unknown> | undefined
    if (!row) return null
    return mapUser(row as any)
  }

  function findUserById(id: string): User | null {
    const row = db!.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!row) return null
    return mapUser(row as any)
  }

  function savePasskey(params: {
    userId: string; credentialId: string; publicKey: string; counter: number; deviceName?: string
  }): void {
    const id = randomUUID()
    const normalizedId = normalizeBase64URL(params.credentialId)
    db!.prepare(`
      INSERT INTO passkeys (id, user_id, credential_id, public_key, counter, device_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, params.userId, normalizedId, params.publicKey, params.counter, params.deviceName ?? null)
  }

  function findPasskeyByCredentialId(credentialId: string): Passkey | null {
    const normalized = normalizeBase64URL(credentialId)
    const row = db!.prepare('SELECT * FROM passkeys WHERE credential_id = ?').get(normalized) as Record<string, unknown> | undefined
    if (!row) return null
    return mapPasskey(row as any)
  }

  function findPasskeysByUserId(userId: string): Passkey[] {
    const rows = db!.prepare('SELECT * FROM passkeys WHERE user_id = ?').all(userId) as Record<string, unknown>[]
    return rows.map((r) => mapPasskey(r as any))
  }

  function updatePasskeyCounter(credentialId: string, counter: number): void {
    const normalized = normalizeBase64URL(credentialId)
    db!.prepare('UPDATE passkeys SET counter = ?, last_used = unixepoch() WHERE credential_id = ?').run(counter, normalized)
  }

  function saveChallenge(challenge: Challenge): void {
    db!.prepare(`
      INSERT INTO challenges (id, challenge, type, expires_at, user_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(challenge.id, challenge.challenge, challenge.type, challenge.expiresAt, challenge.userId)
  }

  function consumeChallenge(challengeId: string): Challenge | null {
    const row = db!.prepare('DELETE FROM challenges WHERE id = ? RETURNING *').get(challengeId) as Record<string, unknown> | undefined
    if (!row) return null
    return mapChallenge(row as any)
  }

  function createSession(userId: string, username: string, maxAge: number): string {
    const id = randomUUID()
    const expiresAt = Math.floor(Date.now() / 1000) + maxAge
    db!.prepare('INSERT INTO sessions (id, user_id, username, expires_at) VALUES (?, ?, ?, ?)').run(id, userId, username, expiresAt)
    return id
  }

  function getSession(sessionId: string): Session | null {
    const row = db!.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as Record<string, unknown> | undefined
    if (!row) return null
    const session = mapSession(row as any)
    if (session.expiresAt < Math.floor(Date.now() / 1000)) {
      db!.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
      return null
    }
    return session
  }

  function deleteSession(sessionId: string): void {
    db!.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
  }

  function cleanupExpired(): void {
    db!.prepare("DELETE FROM challenges WHERE expires_at < unixepoch()").run()
    db!.prepare("DELETE FROM sessions WHERE expires_at < unixepoch()").run()
  }

  return {
    createUser, findUserByUsername, findUserById,
    savePasskey, findPasskeyByCredentialId, findPasskeysByUserId, updatePasskeyCounter,
    saveChallenge, consumeChallenge,
    createSession, getSession, deleteSession,
    cleanupExpired,
  }
}
