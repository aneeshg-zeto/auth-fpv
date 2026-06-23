import { NextResponse, type NextRequest } from 'next/server'
import { resolveWebAuthnConfig, type WebAuthnConfig } from './config'

export function createWebAuthnMiddleware(config?: WebAuthnConfig) {
  return function middleware(req: NextRequest) {
    const resolved = resolveWebAuthnConfig(config)
    const { pathname } = req.nextUrl
    const protectedPaths = resolved.protectedPaths ?? ['/dashboard']
    const isProtected = protectedPaths.some((route) => pathname.startsWith(route))
    if (isProtected && !req.cookies.get(resolved.cookieName)?.value) {
      const loginUrl = new URL(resolved.loginPagePath, req.url)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }
}
