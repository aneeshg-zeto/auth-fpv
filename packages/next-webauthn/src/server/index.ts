export type {
  WebAuthnConfig,
  WebAuthnRouteConfig,
  ResolvedWebAuthnConfig,
} from '../config'
export { resolveWebAuthnConfig, resolveDbPath, defaultRoutes } from '../config'
export {
  createRegisterBeginHandler,
  createRegisterFinishHandler,
  createLoginBeginHandler,
  createLoginFinishHandler,
  createLogoutHandler,
  createMeHandler,
} from './routes'
export { createWebAuthnMiddleware } from './middleware'
