import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/dashboard"];
const loginPagePath = "/login";
const cookieName = "session_id";

export default function webAuthnMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPaths.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtected && !req.cookies.get(cookieName)?.value) {
    return NextResponse.redirect(new URL(loginPagePath, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
