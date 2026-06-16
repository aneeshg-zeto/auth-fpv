# next-webauthn

> Passkey authentication for Next.js App Router. **For Mac.**

No passwords. No browser storage. Just Touch ID, Face ID, or Windows Hello — and an HttpOnly session cookie.

[![npm](https://img.shields.io/npm/v/next-webauthn)](https://www.npmjs.com/package/next-webauthn)
[![license](https://img.shields.io/github/license/aneeshg-zeto/auth-fpv)](LICENSE)
[![CI](https://github.com/aneeshg-zeto/auth-fpv/actions/workflows/ci.yml/badge.svg)](https://github.com/aneeshg-zeto/auth-fpv/actions/workflows/ci.yml)

## Install

```bash
npm install next-webauthn
```

## Requires

- Next.js 14+
- macOS with Touch ID / Face ID (For Mac)
- Node.js 18+

## Quick setup

Create `middleware.ts` at the root of your Next.js project:

```ts
import { createWebAuthnMiddleware } from "next-webauthn/server"

export default createWebAuthnMiddleware()

export const config = {
  matcher: ["/dashboard/:path*"],
}
```

Create `app/api/[...path]/route.ts`:

```ts
import {
  createRegisterBeginHandler,
  createRegisterFinishHandler,
  createLoginBeginHandler,
  createLoginFinishHandler,
  createLogoutHandler,
  createMeHandler,
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

## Security

See [SECURITY.md](SECURITY.md) to report vulnerabilities.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE)

Maintained by [Aneesh G](mailto:aneeshg@zeto.studio).
