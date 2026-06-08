export type {
  WebAuthnConfig,
  WebAuthnRouteConfig,
  ResolvedWebAuthnConfig,
} from './server/config';
export { resolveWebAuthnConfig, resolveDbPath, defaultRoutes } from './server/config';
export { getDb, type WebAuthnDb } from './server/db';
export {
  saveChallenge,
  consumeChallenge,
  findUserByUsername,
  createUser,
  savePasskey,
  findPasskeyByCredentialId,
  findPasskeysByUserId,
  updatePasskeyCounter,
  createSession,
  getSession,
  deleteSession,
} from './server/auth';
export {
  createRegisterBeginHandler,
  createRegisterFinishHandler,
  createLoginBeginHandler,
  createLoginFinishHandler,
  createLogoutHandler,
  createMeHandler,
} from './server/routes';
export { createWebAuthnMiddleware } from './server/middleware';
export { WebAuthnProvider, useClientWebAuthnConfig, type ClientWebAuthnConfig } from './client/hooks/useWebAuthnConfig';
export { useRegister } from './client/hooks/useRegister';
export { useLogin } from './client/hooks/useLogin';
export { useSession, type WebAuthnSession } from './client/hooks/useSession';
export { useWebAuthn } from './client/hooks/useWebAuthn';
export { RegisterForm } from './client/components/RegisterForm';
export { LoginForm } from './client/components/LoginForm';
