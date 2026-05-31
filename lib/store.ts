// lib/store.ts - Shared in-memory storage
export interface StoredUser {
  username: string;
  userId: string;
}

export interface StoredCredential {
  userId: string;
  publicKey: string;
  counter: number;
}

// In-memory maps (will reset on server restart)
export const challenges = new Map<string, string>(); // sessionId/userId -> challenge
export const users = new Map<string, StoredUser>(); // userId -> user
export const credentials = new Map<string, StoredCredential>(); // credentialId -> credential