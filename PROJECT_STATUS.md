# AuthVFP — Project Status

> WebAuthn biometric auth monorepo. Stack: Next.js 16.2.6 App Router · TypeScript · SQLite (`better-sqlite3`) · `@simplewebauthn/server` v13.3.1 · `@simplewebauthn/browser` v13.2.2 · Tailwind CSS v4 · Framer Motion

**Storage rule: ZERO browser/OS storage. All state (challenges, sessions, credentials) lives only in `webauthn.db`.**

---

## What's Done

### Monorepo & Workspace

- [x] Root `package.json` with `workspaces: ["packages/*", "apps/*"]`
- [x] `packages/next-webauthn/` — reusable WebAuthn NPM package
- [x] `apps/demo/` — demo app consuming `next-webauthn` from workspace
- [x] `tsup` dual entry points (`index`, `server`) with CJS + ESM + d.ts

### Package (`packages/next-webauthn/`)

- [x] `src/server/config.ts` — `WebAuthnConfig` interface, `resolveWebAuthnConfig()`, `resolveDbPath()`, `defaultRoutes`, file-based config loading (`next-webauthn.config.ts` / `.js`)
- [x] `src/server/db.ts` — `getDb()` with SQLite schema auto-creation (`users`, `passkeys`, `challenges`, `sessions` tables), WAL mode, in-process DB cache per path
- [x] `src/server/auth.ts` — all DB helpers: `saveChallenge`, `consumeChallenge`, `findUserByUsername`, `createUser`, `savePasskey`, `findPasskeyByCredentialId`, `findPasskeysByUserId`, `updatePasskeyCounter`, `createSession`, `getSession`, `deleteSession`, `normalizeBase64URL`
- [x] `src/server/routes/` — 6 route factories:
  - `register-begin.ts` — `generateRegistrationOptions`, pre-creates user if new, sets `residentKey: 'required'`, keys challenge by username
  - `register-finish.ts` — `verifyRegistrationResponse`, dynamic origin from headers, stores `cred.id` directly (`Base64URLString`)
  - `login-begin.ts` — `generateAuthenticationOptions`, no `allowCredentials` (discoverable), returns `{ needsRegistration }` if user has no passkeys, keys challenge by user.id
  - `login-finish.ts` — normalizes rawId/id, DB lookup with fallback, userHandle-based reregister hint, stale credential detection, challenge consumed by `user.id`
  - `logout.ts` — deletes session + clears cookie
  - `me.ts` — returns `{ userId, username, expiresAt, devices }` from session
- [x] `src/server/middleware.ts` — `createWebAuthnMiddleware()` for edge-level route protection
- [x] `src/server/index.ts` — server entry re-exporting all server symbols
- [x] `src/index.ts` — main entry re-exporting everything including client hooks/components
- [x] Client hooks: `useRegister`, `useLogin`, `useSession` (with `refresh`/`logout`), `useWebAuthn` (aggregate), `useClientWebAuthnConfig` + `WebAuthnProvider`
- [x] Client components: `RegisterForm`, `LoginForm` (controlled, with `onSuccessAction` callbacks)

### Demo App (`apps/demo/`)

- [x] `app/page.tsx` — Landing page with Hero, Features, How It Works, Testimonials, Code Showcase, Footer
- [x] `app/layout.tsx` — Root layout with dark mode + globals.css
- [x] `app/api/[...path]/route.ts` — Catch-all route dispatching to package handlers (POST: register/begin|finish, login/begin|finish, logout; GET: me)
- [x] `app/login/page.tsx` — Login page with biometric prompt, handles `needsRegistration` (redirect to register), `stale_credential` (error message), `reregister` (redirect)
- [x] `app/register/page.tsx` — Register page, reads `username` from URL params, redirects to `/login?registered=true` on success
- [x] `app/dashboard/page.tsx` — Dashboard with user info, session timer, security status, devices, sign-out
- [x] `middleware.ts` — Protects `/dashboard` by checking `session_id` cookie, redirects to `/login`
- [x] `next-webauthn.config.ts` — Consumer config: `rpName`, `rpID`, `origin`, `dbPath`, `sessionMaxAge`, `challengeTTL`, `protectedPaths`, `loginPagePath`
- [x] `next.config.ts` — `serverExternalPackages: ['better-sqlite3']`

### Bugfixes (Login 404 Loop — 7 Root Causes)

All documented in [`problem.md`](./problem.md):

1. **Double-encoding fix**: `register-finish.ts` stores `cred.id` directly (it's `Base64URLString` in `@simplewebauthn/server` v13.3.1+, not `Uint8Array`)
2. **`normalizeBase64URL()`** in `auth.ts` — strips `=`, `+`→`-`, `/`→`_`
3. **All credential_id operations normalize** — `savePasskey`, `findPasskeyByCredentialId`, `updatePasskeyCounter` all call `normalizeBase64URL()`
4. **login-finish.ts normalizes rawId** and falls back to `credential.id` on no match
5. **Unsafe `userHandle`-bypass-crypto session creation removed** — returns `hint: 'reregister'` instead
6. **Challenge keying consistent** — registration keyed by `username`, login keyed by `user.id`
7. **Login page handles stale credentials** — shows error message, no redirect loop

---

## In Progress

- [ ] NPM publish prep (`next-webauthn@0.1.0`)
- [ ] End-to-end verification with fresh DB: register → login → dashboard (200)
- [ ] Stale iCloud Keychain credential test (shows error message)

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Landing + demo in single app | Cleaner UX, one dev command, no cross-app navigation |
| Catch-all route `app/api/[...path]/route.ts` | Single file dispatch, avoids route duplication from multiple files |
| Dynamic origin from headers | Fixes port/protocol mismatches in development |
| `allowCredentials` removed from login | Browser shows all discoverable credentials for RP — credential-based auth without username |
| `normalizeBase64URL()` at all store/read boundaries | Eliminates padding/case encoding mismatches between `@simplewebauthn` versions |
| `hint: 'stale_credential'` (no redirect) | Breaks infinite loop when DB is reset but platform credentials persist |
| Challenge keying: registration by username, login by user.id | Registration needs username for user creation; login uses credential-based identity |
| `cred.id` stored directly (`Base64URLString`), no `Buffer.from()` | `@simplewebauthn/server` v13.3.1+ returns string, not `Uint8Array` |

---

## File Map

### Package (`packages/next-webauthn/`)

```
src/
├── index.ts                                  # Main entry: everything
├── client/
│   ├── components/
│   │   ├── RegisterForm.tsx                  # Controlled register form
│   │   └── LoginForm.tsx                     # Controlled login form
│   └── hooks/
│       ├── useRegister.ts                    # useRegister() hook
│       ├── useLogin.ts                       # useLogin() hook
│       ├── useSession.ts                     # useSession() hook (fetch /me, logout)
│       ├── useWebAuthn.ts                    # Aggregate of all hooks
│       └── useWebAuthnConfig.tsx             # WebAuthnProvider + route config context
└── server/
    ├── index.ts                              # Server entry
    ├── config.ts                             # WebAuthnConfig, resolveWebAuthnConfig, defaultRoutes
    ├── db.ts                                 # getDb(), schema auto-creation
    ├── auth.ts                               # All DB helpers + normalizeBase64URL
    ├── middleware.ts                         # createWebAuthnMiddleware()
    └── routes/
        ├── index.ts                          # Re-exports all route factories
        ├── register-begin.ts                 # createRegisterBeginHandler
        ├── register-finish.ts                # createRegisterFinishHandler
        ├── login-begin.ts                    # createLoginBeginHandler
        ├── login-finish.ts                   # createLoginFinishHandler
        ├── logout.ts                         # createLogoutHandler
        └── me.ts                             # createMeHandler
```

### Demo App (`apps/demo/`)

```
├── middleware.ts                             # Edge middleware for /dashboard
├── next.config.ts                            # serverExternalPackages
├── next-webauthn.config.ts                   # Consumer config
├── app/
│   ├── layout.tsx                            # Root layout (dark mode)
│   ├── page.tsx                              # Landing page
│   ├── login/page.tsx                        # Login page
│   ├── register/page.tsx                     # Register page
│   ├── dashboard/page.tsx                    # Dashboard page
│   └── api/[...path]/route.ts                # Catch-all API route
└── components/
    ├── Hero.tsx                              # Landing hero section
    ├── Features.tsx                          # Feature cards
    ├── HowItWorks.tsx                        # Step-by-step flow
    ├── Testimonials.tsx                      # Testimonial cards
    ├── CodeShowcase.tsx                      # Code snippet display
    └── Footer.tsx                            # Site footer
```

---

## Database Schema

```
users:     id (UUID PK), username (UNIQUE), created_at
passkeys:  id (UUID PK), user_id (FK→users), credential_id (UNIQUE),
           public_key, counter, device_name, created_at, last_used
challenges: username (PK), challenge, type (CHECK 'registration'|'authentication'), expires_at
sessions:  id (UUID PK), user_id (FK→users), username, expires_at
```

---

## Environment

- Node 26.0.0 (host)
- `better-sqlite3` needs `--ignore-scripts` + prebuilt binary on Node 26+
- No `.env.local` needed — origin detected dynamically from `req.headers`
- Tailwind CSS v4 with `@tailwindcss/postcss`

---

## Running

```bash
npm install
npm run dev -w demo
```

Opens at `http://localhost:3000`.
