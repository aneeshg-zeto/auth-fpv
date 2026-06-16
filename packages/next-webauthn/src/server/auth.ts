import { randomUUID } from 'node:crypto'
import { getDb, type WebAuthnDb } from './db'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../config'

export function normalizeBase64URL(s: string): string {
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function validateInput(data: unknown, schema: Record<string, { type: string; required?: boolean; minLength?: number; maxLength?: number; pattern?: RegExp }>): string | null {
  if (typeof data !== 'object' || data === null) return 'Request body must be an object'
  for (const [key, rules] of Object.entries(schema)) {
    const value = (data as Record<string, unknown>)[key]
    if (value === undefined || value === null) {
      if (rules.required) return `${key} is required`
      continue
    }
    if (rules.type === 'string') {
      if (typeof value !== 'string') return `${key} must be a string`
      if (rules.minLength !== undefined && value.length < rules.minLength) return `${key} must be at least ${rules.minLength} characters`
      if (rules.maxLength !== undefined && value.length > rules.maxLength) return `${key} must be at most ${rules.maxLength} characters`
      if (rules.pattern && !rules.pattern.test(value)) return `${key} has invalid format`
    }
    if (rules.type === 'object') {
      if (typeof value !== 'object' || value === null) return `${key} must be an object`
    }
  }
  return null
}

export function rateLimit(ip: string, endpoint: string, maxPerMinute: number, options?: { db?: WebAuthnDb; config?: WebAuthnConfig }): { allowed: boolean } {
  const db = options?.db ?? getDb(options?.config)
  const now = Math.floor(Date.now() / 1000)
  const row = db.prepare('SELECT count, window_start FROM rate_limits WHERE ip = ? AND endpoint = ?').get(ip, endpoint) as { count: number; window_start: number } | undefined
  if (!row) {
    db.prepare('INSERT INTO rate_limits (ip, endpoint, count, window_start) VALUES (?, ?, 1, ?)').run(ip, endpoint, now)
    return { allowed: true }
  }
  if (row.window_start <= now - 60) {
    db.prepare('UPDATE rate_limits SET count = 1, window_start = ? WHERE ip = ? AND endpoint = ?').run(now, ip, endpoint)
    return { allowed: true }
  }
  if (row.count >= maxPerMinute) return { allowed: false }
  db.prepare('UPDATE rate_limits SET count = count + 1 WHERE ip = ? AND endpoint = ?').run(ip, endpoint)
  return { allowed: true }
}

function useDb(db?: WebAuthnDb, config?: WebAuthnConfig): WebAuthnDb {
  return db ?? getDb(config)
}

export interface UserRecord {
  id: string
  username: string
  created_at: number
}

export interface PasskeyRecord {
  id: string
  user_id: string
  credential_id: string
  public_key: string
  counter: number
  device_name: string | null
  created_at?: number
  last_used?: number | null
}

export interface SessionRecord {
  id: string
  user_id: string
  username: string
  expires_at: number
}

export type ChallengeType = 'registration' | 'authentication'

export function saveChallenge(
  key: string,
  challenge: string,
  type: ChallengeType,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
) {
  const db = useDb(options?.db, options?.config)
  const resolved = resolveWebAuthnConfig(options?.config)
  const expiresAt = Math.floor(Date.now() / 1000) + resolved.challengeTTL
  db.prepare(`
    INSERT INTO challenges (key, challenge, type, expires_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET challenge=excluded.challenge,
      type=excluded.type, expires_at=excluded.expires_at
  `).run(key, challenge, type, expiresAt)
}

export function consumeChallenge(
  key: string,
  type: ChallengeType,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): string | null {
  const db = useDb(options?.db, options?.config)
  const row = db
    .prepare('SELECT challenge, expires_at FROM challenges WHERE key = ? AND type = ?')
    .get(key, type) as { challenge: string; expires_at: number } | undefined
  if (!row) return null
  if (row.expires_at < Math.floor(Date.now() / 1000)) {
    db.prepare('DELETE FROM challenges WHERE key = ?').run(key)
    return null
  }
  db.prepare('DELETE FROM challenges WHERE key = ?').run(key)
  return row.challenge
}

export function findUserByUsername(
  username: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): UserRecord | undefined {
  const db = useDb(options?.db, options?.config)
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRecord | undefined
}

export function findUserById(
  id: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): UserRecord | undefined {
  const db = useDb(options?.db, options?.config)
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRecord | undefined
}

export function createUser(
  username: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): string {
  const db = useDb(options?.db, options?.config)
  const id = randomUUID()
  const now = Math.floor(Date.now() / 1000)
  db.prepare('INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)').run(id, username, now)
  return id
}

export function savePasskey(
  params: {
    userId: string
    credentialId: string
    publicKey: string
    counter: number
    deviceName?: string
  },
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
) {
  const db = useDb(options?.db, options?.config)
  db.prepare(`
    INSERT INTO passkeys (id, user_id, credential_id, public_key, counter, device_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    params.userId,
    normalizeBase64URL(params.credentialId),
    params.publicKey,
    params.counter,
    params.deviceName ?? null,
  )
}

export function findPasskeyByCredentialId(
  credentialId: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): PasskeyRecord | undefined {
  const db = useDb(options?.db, options?.config)
  const normalized = normalizeBase64URL(credentialId)
  return db
    .prepare('SELECT * FROM passkeys WHERE credential_id = ?')
    .get(normalized) as PasskeyRecord | undefined
}

export function findPasskeysByUserId(
  userId: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): PasskeyRecord[] {
  const db = useDb(options?.db, options?.config)
  return db.prepare('SELECT * FROM passkeys WHERE user_id = ?').all(userId) as PasskeyRecord[]
}

export function updatePasskeyCounter(
  credentialId: string,
  counter: number,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
) {
  const db = useDb(options?.db, options?.config)
  db.prepare('UPDATE passkeys SET counter = ?, last_used = unixepoch() WHERE credential_id = ?').run(
    counter,
    normalizeBase64URL(credentialId),
  )
}

export function createSession(
  userId: string,
  username: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): string {
  const db = useDb(options?.db, options?.config)
  const resolved = resolveWebAuthnConfig(options?.config)
  const id = randomUUID()
  const expiresAt = Math.floor(Date.now() / 1000) + resolved.sessionMaxAge
  db.prepare('INSERT INTO sessions (id, user_id, username, expires_at) VALUES (?, ?, ?, ?)').run(
    id,
    userId,
    username,
    expiresAt,
  )
  return id
}

export function getSession(
  sessionId: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
): SessionRecord | undefined {
  const db = useDb(options?.db, options?.config)
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as SessionRecord | undefined
  if (!session) return undefined
  if (session.expires_at < Math.floor(Date.now() / 1000)) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
    return undefined
  }
  return session
}

export function deleteSession(
  sessionId: string,
  options?: { db?: WebAuthnDb; config?: WebAuthnConfig },
) {
  const db = useDb(options?.db, options?.config)
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
}
