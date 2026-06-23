export type {
  WebAuthnConfig,
  WebAuthnRouteConfig,
  ResolvedWebAuthnConfig,
} from './server/config'
export {
  resolveWebAuthnConfig,
  resolveDbPath,
  defaultRoutes,
} from './server/config'
export {
  createRegisterBeginHandler,
  createRegisterFinishHandler,
  createLoginBeginHandler,
  createLoginFinishHandler,
  createLogoutHandler,
  createMeHandler,
} from './server/routes'
export { createWebAuthnMiddleware } from './server/middleware'
export type { Adapter } from './server/db/interface'
export { createSqliteAdapter } from './server/db/sqlite'
export { getAdapter, normalizeBase64URL, toBase64URL, validateInput } from './server/auth'
export { createRateLimiter, type RateLimitConfig } from './server/rate-limit'
export type { User, Passkey, Challenge, Session } from './types'
