import Database from 'better-sqlite3';
import path from 'path';

// Initialize database
const db = new Database(path.join(process.cwd(), 'webauthn.db'));

// Create tables
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at INTEGER NOT NULL
  );

  -- Passkeys table (biometric credentials)
  CREATE TABLE IF NOT EXISTS passkeys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    counter INTEGER NOT NULL,
    device_name TEXT,
    created_at INTEGER NOT NULL,
    last_used INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Sessions table (optional, for tracking)
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON passkeys(user_id);
  CREATE INDEX IF NOT EXISTS idx_passkeys_credential_id ON passkeys(credential_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
`);

// User operations
export const User = {
  create: db.prepare(`
    INSERT INTO users (id, username, created_at)
    VALUES (?, ?, ?)
  `),
  
  findByUsername: db.prepare(`
    SELECT * FROM users WHERE username = ?
  `),
  
  findById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),
};

// Passkey operations
export const Passkey = {
  create: db.prepare(`
    INSERT INTO passkeys (id, user_id, credential_id, public_key, counter, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  
  findByCredentialId: db.prepare(`
    SELECT p.*, u.username 
    FROM passkeys p
    JOIN users u ON u.id = p.user_id
    WHERE p.credential_id = ?
  `),
  
  findByUserId: db.prepare(`
    SELECT * FROM passkeys WHERE user_id = ?
  `),
  
  updateCounter: db.prepare(`
    UPDATE passkeys SET counter = ?, last_used = ? WHERE credential_id = ?
  `),
};

// Session operations (optional)
export const Session = {
  create: db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `),
  
  findById: db.prepare(`
    SELECT s.*, u.username 
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > ?
  `),
  
  delete: db.prepare(`
    DELETE FROM sessions WHERE id = ?
  `),
};

export default db;