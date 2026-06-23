import type { User, Passkey, Challenge, Session } from '../../types'

export interface Adapter {
  createUser(username: string): User
  findUserByUsername(username: string): User | null
  findUserById(id: string): User | null
  savePasskey(params: {
    userId: string
    credentialId: string
    publicKey: string
    counter: number
    deviceName?: string
  }): void
  findPasskeyByCredentialId(credentialId: string): Passkey | null
  findPasskeysByUserId(userId: string): Passkey[]
  updatePasskeyCounter(credentialId: string, counter: number): void
  saveChallenge(challenge: Challenge): void
  consumeChallenge(challengeId: string): Challenge | null
  createSession(userId: string, username: string, maxAge: number): string
  getSession(sessionId: string): Session | null
  deleteSession(sessionId: string): void
  cleanupExpired(): void
}
