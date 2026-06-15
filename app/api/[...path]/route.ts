import {
  createRegisterBeginHandler,
  createRegisterFinishHandler,
  createLoginBeginHandler,
  createLoginFinishHandler,
  createLogoutHandler,
  createMeHandler,
} from "next-webauthn/server";
import type { NextRequest } from "next/server";

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
  const joined = path.join("/");

  if (joined === "register/begin") return registerBegin(req);
  if (joined === "register/finish") return registerFinish(req);
  if (joined === "login/begin") return loginBegin(req);
  if (joined === "login/finish") return loginFinish(req);
  if (joined === "logout") return logout(req);

  return new Response("Not found", { status: 404 });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const joined = path.join("/");

  if (joined === "me") return me(req);

  return new Response("Not found", { status: 404 });
}
