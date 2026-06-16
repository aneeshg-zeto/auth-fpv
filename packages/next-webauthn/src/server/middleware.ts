import { NextResponse, type NextRequest, type NextMiddleware } from 'next/server'
import { resolveWebAuthnConfig, type WebAuthnConfig } from '../config'

export function createWebAuthnMiddleware(config?: WebAuthnConfig): NextMiddleware {
  return function webAuthnMiddleware(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config)
    const { pathname } = req.nextUrl
    const protectedPaths = resolved.protectedPaths ?? ['/dashboard']
    const isProtected = protectedPaths.some((route) => pathname.startsWith(route))
    if (isProtected && !req.cookies.get(resolved.cookieName)?.value) {
      return NextResponse.redirect(new URL(resolved.loginPagePath, req.url))
    }
    return NextResponse.next()
  }
}
