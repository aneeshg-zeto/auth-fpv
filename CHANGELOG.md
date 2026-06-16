# Changelog

All notable changes to `next-webauthn` are documented here.

## 0.1.0

Initial open-source release. For Mac.

- Passkey registration and login via @simplewebauthn/server v13.3.1
- SQLite-backed challenges, passkeys, sessions
- Zero browser storage
- Next.js App Router route factories
- Client hooks: useRegister, useLogin, useSession, useWebAuthn
- Client components: RegisterForm, LoginForm
- Challenge expiry (5 min), session expiry (7 days)
- Rate limiting on auth endpoints
