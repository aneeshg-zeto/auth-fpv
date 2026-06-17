import type { NextRequest } from "next/server"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const joined = path.join("/")
  const m = await import("next-webauthn/server")

  if (joined === "register/begin") return m.createRegisterBeginHandler()(req)
  if (joined === "register/finish") return m.createRegisterFinishHandler()(req)
  if (joined === "login/begin") return m.createLoginBeginHandler()(req)
  if (joined === "login/finish") return m.createLoginFinishHandler()(req)
  if (joined === "logout") return m.createLogoutHandler()(req)

  return new Response("Not found", { status: 404 })
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const joined = path.join("/")

  if (joined === "me") {
    const m = await import("next-webauthn/server")
    return m.createMeHandler()(req)
  }

  return new Response("Not found", { status: 404 })
}
