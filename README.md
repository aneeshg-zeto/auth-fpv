# next-webauthn workspace

This repository contains:

- a demo Next.js app in `my-webauthn-app/`
- a reusable package in `my-webauthn-app/packages/next-webauthn/`

The goal is to turn the original local WebAuthn implementation into a reusable package that provides biometric auth for Next.js App Router apps with SQLite-backed state.

## What the package provides

`next-webauthn` is designed to provide:

- zero browser storage (`localStorage`, `sessionStorage`, IndexedDB not used)
- SQLite-backed challenge, passkey, and session storage
- one-line middleware for protected pages
- reusable route handlers for:
  - register begin
  - register finish
  - login begin
  - login finish
  - logout
  - me
- React hooks and drop-in components
- config-driven setup via `next-webauthn.config.ts`

## Package location

The package source lives at:

- `packages/next-webauthn`

Main entry:

- `packages/next-webauthn/src/index.ts`

## Current status

### Complete

- monorepo-style workspace scaffold added
- package metadata and bundling config added
- server config extraction completed
- DB/auth helpers extracted into package
- middleware factory added
- route handler factories added
- client hooks added
- client components added
- package README added
- package-local diagnostics cleaned up

### In progress / not fully validated

- demo app is not yet fully rewired to consume the package end-to-end
- npm install/build validation is blocked in this environment by native `better-sqlite3` compilation under Node `26.0.0`
- npm publish has not been executed

## Environment note

The current machine is using Node `26.0.0`. `better-sqlite3` failed to compile during `npm install`, so full runtime validation could not be completed here.

If you want a more reliable local demo/build path, use an LTS Node version that `better-sqlite3` supports well.

## Local development

From the app root:

```bash
npm install
npm run dev
```

Because of the native dependency issue above, `npm install` may fail on this machine until the Node version is adjusted.

## Package quick start

See:

- `packages/next-webauthn/README.md`

That README documents:

- config
- route mounting
- middleware
- hooks/components
- publishing notes

## Important implementation notes

- all WebAuthn verification stays server-side
- the browser only receives an opaque HttpOnly session cookie
- DB path is resolved relative to `process.cwd()`
- the current challenge design is still keyed by username to preserve the original behavior

## Demo readiness

This repo is **package-refactor ready**, but **not yet fully demo-wired** inside the existing app.

When the app is rewired to use the package routes/middleware directly and passes runtime validation, it will be ready for a full demo.
