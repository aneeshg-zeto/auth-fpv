export type {
  WebAuthnConfig,
  WebAuthnRouteConfig,
  ResolvedWebAuthnConfig,
} from '../config'
export { resolveWebAuthnConfig, resolveDbPath, defaultRoutes } from '../config'
export { getDb, type WebAuthnDb } from './db'
export {
  normalizeBase64URL,
  validateInput,
  rateLimit,
  saveChallenge,
  consumeChallenge,
  findUserByUsername,
  findUserById,
  createUser,
  savePasskey,
  findPasskeyByCredentialId,
  findPasskeysByUserId,
  updatePasskeyCounter,
  createSession,
  getSession,
  deleteSession,
} from './auth'
export {
  createRegisterBeginHandler,
  createRegisterFinishHandler,
  createLoginBeginHandler,
  createLoginFinishHandler,
  createLogoutHandler,
  createMeHandler,
} from './routes'
export { createWebAuthnMiddleware } from './middleware'
