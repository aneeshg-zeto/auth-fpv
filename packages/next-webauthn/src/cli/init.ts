#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function findProjectRoot(): string {
  let dir = process.cwd()
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return process.cwd()
}

function resolveSrcDir(root: string): string {
  const src = path.join(root, 'src')
  return fs.existsSync(src) && fs.statSync(src).isDirectory() ? src : root
}

function detectAppRouter(root: string, srcDir: string): boolean {
  const appPaths = [
    path.join(srcDir, 'app', 'layout.tsx'),
    path.join(srcDir, 'app', 'layout.jsx'),
    path.join(root, 'app', 'layout.tsx'),
    path.join(root, 'app', 'layout.jsx'),
  ]
  return appPaths.some((p) => fs.existsSync(p))
}

const routeHandlerContent = `import {
  createRegisterBeginHandler,
  createRegisterFinishHandler,
  createLoginBeginHandler,
  createLoginFinishHandler,
  createLogoutHandler,
  createMeHandler,
} from 'next-webauthn'

export const POST = {
  register: {
    begin: createRegisterBeginHandler(),
    finish: createRegisterFinishHandler(),
  },
  login: {
    begin: createLoginBeginHandler(),
    finish: createLoginFinishHandler(),
  },
  logout: createLogoutHandler(),
}

export const GET = {
  me: createMeHandler(),
}
`

const middlewareContent = `export { createWebAuthnMiddleware as default } from 'next-webauthn'

export const config = {
  matcher: ['/dashboard/:path*'],
}
`

const envContent = `RP_ID=localhost
ORIGIN=http://localhost:3000
`

function init(): void {
  const root = findProjectRoot()
  const srcDir = resolveSrcDir(root)

  if (!detectAppRouter(root, srcDir)) {
    console.error('Error: next-webauthn only supports Next.js App Router.')
    console.error('No app/layout.tsx found. Please ensure you are in a Next.js project with App Router.')
    process.exit(1)
  }

  const routeDir = path.join(srcDir, 'app', 'api', 'auth', '[...path]')
  fs.mkdirSync(routeDir, { recursive: true })
  const routeFile = path.join(routeDir, 'route.ts')
  if (!fs.existsSync(routeFile)) {
    fs.writeFileSync(routeFile, routeHandlerContent, 'utf-8')
    console.log('✓ Created', path.relative(root, routeFile))
  } else {
    console.log('• Skipped (already exists):', path.relative(root, routeFile))
  }

  const middlewareFile = path.join(root, 'middleware.ts')
  if (!fs.existsSync(middlewareFile)) {
    fs.writeFileSync(middlewareFile, middlewareContent, 'utf-8')
    console.log('✓ Created', path.relative(root, middlewareFile))
  } else {
    console.log('• Skipped (already exists):', path.relative(root, middlewareFile))
  }

  const envFile = path.join(root, '.env.local')
  if (!fs.existsSync(envFile)) {
    fs.writeFileSync(envFile, envContent, 'utf-8')
    console.log('✓ Created', path.relative(root, envFile))
  } else {
    const existing = fs.readFileSync(envFile, 'utf-8')
    if (!existing.includes('RP_ID=')) {
      fs.appendFileSync(envFile, '\n' + envContent, 'utf-8')
      console.log('✓ Updated', path.relative(root, envFile), '(added RP_ID and ORIGIN)')
    } else {
      console.log('• Skipped (already configured):', path.relative(root, envFile))
    }
  }

  console.log('')
  console.log('next-webauthn is ready!')
  console.log('')
  console.log('Next steps:')
  console.log('  1. Add <LoginForm /> to your login page:')
  console.log('     import { LoginForm } from "next-webauthn/client"')
  console.log('  2. Add <AutoFillPasskeyButton /> for one-tap passkey login')
  console.log('  3. Run npm run dev and visit your app')
  console.log('')
  console.log('Documentation: https://github.com/aneeshg-zeto/auth-fpv')
}

init()
