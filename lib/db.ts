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