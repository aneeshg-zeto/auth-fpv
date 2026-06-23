export type { WebAuthnConfig, WebAuthnRouteConfig, ResolvedWebAuthnConfig } from './config'
export { resolveWebAuthnConfig, resolveDbPath, defaultRoutes } from './config'
export {
  createRegisterBeginHandler,
  createRegisterFinishHandler,
  createLoginBeginHandler,
  createLoginFinishHandler,
  createLogoutHandler,
  createMeHandler,
} from './routes'
export { createWebAuthnMiddleware } from './middleware'
export type { Adapter } from './db/interface'
export { createSqliteAdapter } from './db/sqlite'
export { getAdapter, normalizeBase64URL, toBase64URL, validateInput } from './auth'
export type { User, Passkey, Challenge, Session } from '../types'
