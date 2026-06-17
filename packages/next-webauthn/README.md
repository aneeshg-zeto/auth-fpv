# next-webauthn

Drop-in passkey authentication for Next.js App Router. **For Mac.**

## Install

```bash
npm install next-webauthn
```

Peer dependencies: `next >= 14`, `react >= 18`, `react-dom >= 18`.

## Quick start

### 1. Middleware

```ts
// middleware.ts
import { createWebAuthnMiddleware } from "next-webauthn/server"

export default createWebAuthnMiddleware()

export const config = { matcher: ["/dashboard/:path*"] }
```

### 2. Route handler

```ts
// app/api/[...path]/route.ts
import {
  createRegisterBeginHandler, createRegisterFinishHandler,
  createLoginBeginHandler, createLoginFinishHandler,
  createLogoutHandler, createMeHandler,
} from "next-webauthn/server"
import type { NextRequest } from "next/server"

const registerBegin = createRegisterBeginHandler()
const registerFinish = createRegisterFinishHandler()
const loginBegin = createLoginBeginHandler()
const loginFinish = createLoginFinishHandler()
const logout = createLogoutHandler()
const me = createMeHandler()

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const joined = path.join("/")
  if (joined === "register/begin") return registerBegin(req)
  if (joined === "register/finish") return registerFinish(req)
  if (joined === "login/begin") return loginBegin(req)
  if (joined === "login/finish") return loginFinish(req)
  if (joined === "logout") return logout(req)
  return new Response("Not found", { status: 404 })
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const joined = path.join("/")
  if (joined === "me") return me(req)
  return new Response("Not found", { status: 404 })
}
```

### 3. Client components

```tsx
import { LoginForm, RegisterForm } from "next-webauthn/client"
import { useRouter } from "next/navigation"

export function AuthScreens() {
  const router = useRouter()
  return (
    <>
      <RegisterForm onSuccessAction={() => router.push("/login")} />
      <LoginForm onSuccessAction={() => router.push("/dashboard")} />
    </>
  )
}
```

## Configuration

Create `next-webauthn.config.ts` in your project root:

```ts
import type { WebAuthnConfig } from "next-webauthn/server"

const config: WebAuthnConfig = {
  rpName: "My App",
  rpID: process.env.RP_ID ?? "localhost",
  origin: process.env.ORIGIN ?? "http://localhost:3000",
  dbPath: "webauthn.db",
  sessionMaxAge: 604800,
  challengeTTL: 300,
  protectedPaths: ["/dashboard"],
  loginPagePath: "/login",
  cookieName: "session_id",
}

export default config
```

### Config fields

`rpName` · `rpID` · `origin` · `dbPath` · `sessionMaxAge` · `challengeTTL` · `cookieName` · `cookieOptions` · `routes` · `protectedPaths` · `loginPagePath`

## Database

SQLite database is created at `process.cwd() + '/webauthn.db'`.

Tables: `users`, `passkeys`, `challenges`, `sessions`, `rate_limits`.

Challenges expire in 5 minutes. Sessions expire in 7 days. Rate limits reset every minute.

## Client API

Import from `next-webauthn/client`:

- `useRegister(config?)` — `{ startRegister(username), loading, error }`
- `useLogin(config?)` — `{ startLogin(username), loading, error }`
- `useSession(config?)` — `{ user, loading, refresh, logout }`
- `useWebAuthn(config?)` — aggregate of all three hooks
- `RegisterForm` — controlled form component with `onSuccessAction`
- `LoginForm` — controlled form component with `onSuccessAction`

Optional `config.routes` overrides the default API paths.

## Server API

Import from `next-webauthn/server`:

- Route factories: `createRegisterBeginHandler`, `createRegisterFinishHandler`, `createLoginBeginHandler`, `createLoginFinishHandler`, `createLogoutHandler`, `createMeHandler`
- `createWebAuthnMiddleware(config?)` — edge middleware
- `resolveWebAuthnConfig(config?)`, `resolveDbPath(config?)`, `defaultRoutes`

## Security

- All cryptographic verification is server-side
- Challenges are one-time use with 5-minute expiry
- Sessions expire after 7 days
- Rate limiting on all auth endpoints (5/min registration, 10/min login)
- HttpOnly, Secure, SameSite=Strict cookies only
- No browser storage of any kind
