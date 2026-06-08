import { createWebAuthnMiddleware } from "./packages/next-webauthn/src";

export default createWebAuthnMiddleware();

export const config = {
  matcher: ["/dashboard/:path*"],
};
