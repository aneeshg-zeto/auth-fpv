# next-webauthn

Single-import biometric auth package for Next.js App Router projects.

## Overview

`next-webauthn` packages a SQLite-backed WebAuthn flow into reusable server helpers, route factories, middleware, hooks, and components.

It preserves the original project constraints:

- no `localStorage`
- no `sessionStorage`
- no in-memory challenge/session maps
- all cryptographic verification on the server
- only an opaque HttpOnly cookie in the browser for session lookup

## Current status

### Implemented

- `WebAuthnConfig` with sensible defaults
- DB initialization via `getDb(config?)`
- extracted auth helpers in `src/server/auth.ts`
- reusable route factories in `src/server/routes/`
- `createWebAuthnMiddleware(config?)`
- client hooks:
  - `useRegister()`
  - `useLogin()`
  - `useSession()`
  - `useWebAuthn()`
- client components:
  - `RegisterForm`
  - `LoginForm`
- public exports through `src/index.ts`
- `tsup` build config for CJS + ESM + d.ts output

### Not fully validated in this environment

- full `npm install` / `tsup build`
- consumer-app runtime smoke test
- npm publish

Reason: `better-sqlite3` failed to compile here under Node `26.0.0`.

## Install

```bash
npm install next-webauthn @simplewebauthn/browser
```

Peer dependencies:

- `next >= 15`
- `react`
- `react-dom`
- `@simplewebauthn/browser`

Package dependencies include:

- `@simplewebauthn/server`
- `better-sqlite3`

## Configuration

Create `next-webauthn.config.ts` in the consumer project root:

```ts
import type { WebAuthnConfig } from 'next-webauthn';

const config: WebAuthnConfig = {
  rpName: 'My WebAuthn App',
  rpID: process.env.RP_ID ?? 'localhost',
  origin: process.env.ORIGIN ?? 'http://localhost:3000',
  dbPath: 'webauthn.db',
  sessionMaxAge: 60 * 60 * 8,
  challengeTTL: 120,
  protectedPaths: ['/dashboard'],
  loginPagePath: '/login',
  cookieName: 'session_id',
};

export default config;
```

### Supported config fields

- `rpName`
- `rpID`
- `origin`
- `dbPath`
- `sessionMaxAge`
- `challengeTTL`
- `cookieName`
- `cookieOptions`
- `routes`
- `protectedPaths`
- `loginPagePath`

## Database behavior

The DB path is resolved relative to `process.cwd()`.

That means the SQLite database lives in the consumer app, not inside `node_modules`.

Default database filename:

- `webauthn.db`

## Route mounting

Create `app/api/auth/[...path]/route.ts` in the consumer app:

```ts
import {
  createLoginBeginHandler,
  createLoginFinishHandler,
  createLogoutHandler,
  createMeHandler,
  createRegisterBeginHandler,
  createRegisterFinishHandler,
} from 'next-webauthn';
import type { NextRequest } from 'next/server';

const registerBegin = createRegisterBeginHandler();
const registerFinish = createRegisterFinishHandler();
const loginBegin = createLoginBeginHandler();
const loginFinish = createLoginFinishHandler();
const logout = createLogoutHandler();
const me = createMeHandler();

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const joined = path.join('/');

  if (joined === 'register/begin') return registerBegin(req);
  if (joined === 'register/finish') return registerFinish(req);
  if (joined === 'login/begin') return loginBegin(req);
  if (joined === 'login/finish') return loginFinish(req);
  if (joined === 'logout') return logout(req);

  return new Response('Not found', { status: 404 });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const joined = path.join('/');

  if (joined === 'me') return me(req);

  return new Response('Not found', { status: 404 });
}
```

## Middleware

Create `middleware.ts`:

```ts
import { createWebAuthnMiddleware } from 'next-webauthn';

export default createWebAuthnMiddleware();

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

## Client usage

### Hooks

```tsx
'use client';

import { useLogin, useRegister, useSession } from 'next-webauthn';

export function Example() {
  const { startRegister, loading: registerLoading, error: registerError } = useRegister();
  const { startLogin, loading: loginLoading, error: loginError } = useLogin();
  const { user, loading: sessionLoading, refresh, logout } = useSession();

  return null;
}
```

### Components

```tsx
'use client';

import { LoginForm, RegisterForm } from 'next-webauthn';
import { useRouter } from 'next/navigation';

export function AuthScreens() {
  const router = useRouter();

  return (
    <>
      <RegisterForm onSuccessAction={() => router.push('/login')} />
      <LoginForm onSuccessAction={() => router.push('/dashboard')} />
    </>
  );
}
```

### Optional route overrides

```tsx
'use client';

import { WebAuthnProvider } from 'next-webauthn';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WebAuthnProvider
      config={{
        routes: {
          loginBegin: '/api/custom-auth/login/begin',
          loginFinish: '/api/custom-auth/login/finish',
          me: '/api/custom-auth/me',
        },
      }}
    >
      {children}
    </WebAuthnProvider>
  );
}
```

## Public API

### Server exports

- `resolveWebAuthnConfig`
- `resolveDbPath`
- `defaultRoutes`
- `getDb`
- auth helpers from `src/server/auth.ts`
- `createRegisterBeginHandler`
- `createRegisterFinishHandler`
- `createLoginBeginHandler`
- `createLoginFinishHandler`
- `createLogoutHandler`
- `createMeHandler`
- `createWebAuthnMiddleware`

### Client exports

- `WebAuthnProvider`
- `useClientWebAuthnConfig`
- `useRegister`
- `useLogin`
- `useSession`
- `useWebAuthn`
- `RegisterForm`
- `LoginForm`

## Notes and caveats

### Config file loading

The package currently attempts to load:

- `next-webauthn.config.ts`
- `next-webauthn.config.js`

In real consumer environments, `.js` config is generally the safest option unless the runtime/tooling explicitly supports loading TypeScript config files directly.

### Challenge keying

The challenge table is still keyed by username to preserve the behavior of the original app.

That means multiple concurrent pending ceremonies for the same username are not yet handled more robustly.

### Native dependency

`better-sqlite3` is a native module. Make sure your Node version is supported in the environment where you install/build this package.

## Validation

Package-local diagnostics were checked for the current source files and cleaned up.

Full install/build validation was not completed here because `better-sqlite3` failed to compile under Node `26.0.0`.

## Publishing

When validation passes in a supported environment:

```bash
cd packages/next-webauthn
npm publish
```

## Recommended next steps

1. Wire the demo app to consume the package routes and middleware directly.
2. Validate in a supported Node LTS environment.
3. Run a real smoke test: register, login, session fetch, logout, protected-route redirect.
4. Publish to npm.
