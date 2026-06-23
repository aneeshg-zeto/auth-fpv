export interface User {
  id: string
  username: string
  createdAt: number
}

export interface Passkey {
  id: string
  userId: string
  credentialId: string
  publicKey: string
  counter: number
  deviceName: string | null
  createdAt: number
  lastUsed: number | null
}

export interface Challenge {
  id: string
  challenge: string
  type: 'registration' | 'authentication'
  expiresAt: number
  userId: string | null
}

export interface Session {
  id: string
  userId: string
  username: string
  expiresAt: number
}
