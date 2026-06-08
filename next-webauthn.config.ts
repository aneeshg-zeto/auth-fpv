import type { WebAuthnConfig } from "./packages/next-webauthn/src/server/config";

const config: WebAuthnConfig = {
  rpName: "My WebAuthn App",
  rpID: process.env.RP_ID ?? "localhost",
  origin: process.env.ORIGIN ?? "http://localhost:3000",
  dbPath: "webauthn.db",
  sessionMaxAge: 60 * 60 * 8,
  challengeTTL: 120,
  protectedPaths: ["/dashboard"],
  loginPagePath: "/login",
};

export default config;
