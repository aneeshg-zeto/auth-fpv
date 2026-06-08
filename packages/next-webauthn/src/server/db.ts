import Database from 'better-sqlite3';
import { resolveDbPath, type WebAuthnConfig } from './config';

const cache = new Map<string, Database.Database>();

const schema = `
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

  CREATE TABLE IF NOT EXISTS challenges (
    username    TEXT PRIMARY KEY,
    challenge   TEXT NOT NULL,
    type        TEXT NOT NULL CHECK(type IN ('registration','authentication')),
    expires_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username    TEXT NOT NULL,
    expires_at  INTEGER NOT NULL
  );
`;

export type WebAuthnDb = Database.Database;

export function getDb(config?: WebAuthnConfig): WebAuthnDb {
  const dbPath = resolveDbPath(config);
  const existing = cache.get(dbPath);
  if (existing) return existing;

  const db = new Database(dbPath);
  db.exec(schema);
  cache.set(dbPath, db);
  return db;
}
