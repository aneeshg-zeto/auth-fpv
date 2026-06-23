import path from 'node:path'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import type { User, Passkey } from '../types'

export interface WebAuthnConfig {
  rpName?: string
  rpID?: string
  origin?: string
  dbPath?: string
  sessionMaxAge?: number
  challengeTTL?: number
  cookieName?: string
  cookieOptions?: {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    path?: string
    domain?: string
    maxAge?: number
  }
  routes?: Partial<WebAuthnRouteConfig>
  protectedPaths?: string[]
  loginPagePath?: string
  onLogin?: (user: User, passkey: Passkey, req: Request) => void | Promise<void>
  onRegister?: (user: User, passkey: Passkey, req: Request) => void | Promise<void>
  onError?: (error: Error, req: Request) => void | Promise<void>
}

export interface WebAuthnRouteConfig {
  registerBegin: string
  registerFinish: string
  loginBegin: string
  loginFinish: string
  logout: string
  me: string
}

export const defaultRoutes: WebAuthnRouteConfig = {
  registerBegin: '/api/auth/register/begin',
  registerFinish: '/api/auth/register/finish',
  loginBegin: '/api/auth/login/begin',
  loginFinish: '/api/auth/login/finish',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
}

const defaultConfig: Required<Omit<WebAuthnConfig, 'cookieOptions' | 'routes' | 'onLogin' | 'onRegister' | 'onError'>> & {
  cookieOptions: NonNullable<WebAuthnConfig['cookieOptions']>
  routes: WebAuthnRouteConfig
} = {
  rpName: 'next-webauthn',
  rpID: process.env.RP_ID ?? 'localhost',
  origin: process.env.ORIGIN ?? 'http://localhost:3000',
  dbPath: 'webauthn.db',
  sessionMaxAge: 604800,
  challengeTTL: 300,
  cookieName: 'session_id',
  cookieOptions: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 604800,
  },
  routes: defaultRoutes,
  protectedPaths: ['/dashboard'],
  loginPagePath: '/login',
}

let cachedConfig: ResolvedWebAuthnConfig | null = null

function createLoader() {
  try {
    return createRequire(import.meta.url)
  } catch {
    return createRequire(path.join(process.cwd(), '_'))
  }
}

const nodeRequire = createLoader()

export interface ResolvedWebAuthnConfig {
  rpName: string
  rpID: string
  origin: string
  dbPath: string
  sessionMaxAge: number
  challengeTTL: number
  cookieName: string
  cookieOptions: NonNullable<WebAuthnConfig['cookieOptions']>
  routes: WebAuthnRouteConfig
  protectedPaths: string[]
  loginPagePath: string
  onLogin?: (user: User, passkey: Passkey, req: Request) => void | Promise<void>
  onRegister?: (user: User, passkey: Passkey, req: Request) => void | Promise<void>
  onError?: (error: Error, req: Request) => void | Promise<void>
}

function readProjectConfig(): WebAuthnConfig {
  const tsPath = path.join(process.cwd(), 'next-webauthn.config.ts')
  const jsPath = path.join(process.cwd(), 'next-webauthn.config.js')
  const configPath = fs.existsSync(tsPath) ? tsPath : fs.existsSync(jsPath) ? jsPath : null
  if (!configPath) return {}
  try {
    const required = nodeRequire(configPath)
    return (required.default ?? required) as WebAuthnConfig
  } catch {
    return {}
  }
}

export function resolveWebAuthnConfig(config?: WebAuthnConfig): ResolvedWebAuthnConfig {
  if (!config && cachedConfig) return cachedConfig
  const projectConfig = readProjectConfig()
  const mergedRoutes: WebAuthnRouteConfig = {
    ...defaultRoutes,
    ...(projectConfig.routes ?? {}),
    ...(config?.routes ?? {}),
  }
  const resolved: ResolvedWebAuthnConfig = {
    ...defaultConfig,
    ...projectConfig,
    ...config,
    routes: mergedRoutes,
    cookieOptions: {
      ...defaultConfig.cookieOptions,
      ...(projectConfig.cookieOptions ?? {}),
      ...(config?.cookieOptions ?? {}),
    },
  }
  resolved.cookieOptions.maxAge ??= resolved.sessionMaxAge
  if (resolved.origin && new URL(resolved.origin).hostname !== resolved.rpID) {
    throw new Error('Origin hostname must match rpID')
  }
  if (!config) cachedConfig = resolved
  return resolved
}

export function resolveDbPath(config?: WebAuthnConfig): string {
  const resolved = resolveWebAuthnConfig(config)
  return path.isAbsolute(resolved.dbPath)
    ? resolved.dbPath
    : path.join(process.cwd(), resolved.dbPath)
}
