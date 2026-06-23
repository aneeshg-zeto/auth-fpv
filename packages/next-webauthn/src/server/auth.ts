import type { Adapter } from './db/interface'
import { createSqliteAdapter } from './db/sqlite'
import type { ResolvedWebAuthnConfig } from './config'

export function normalizeBase64URL(s: string): string {
  return s.replace(/-/g, '+').replace(/_/g, '/')
}

export function toBase64URL(s: string): string {
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function validateInput(data: unknown, schema: Record<string, { type: string; required?: boolean; minLength?: number; maxLength?: number; pattern?: RegExp }>): string | null {
  if (typeof data !== 'object' || data === null) return 'Request body must be an object'
  for (const [key, rules] of Object.entries(schema)) {
    const value = (data as Record<string, unknown>)[key]
    if (value === undefined || value === null) {
      if (rules.required) return `${key} is required`
      continue
    }
    if (rules.type === 'string') {
      if (typeof value !== 'string') return `${key} must be a string`
      if (rules.minLength !== undefined && value.length < rules.minLength) return `${key} must be at least ${rules.minLength} characters`
      if (rules.maxLength !== undefined && value.length > rules.maxLength) return `${key} must be at most ${rules.maxLength} characters`
      if (rules.pattern && !rules.pattern.test(value)) return `${key} has invalid format`
    }
    if (rules.type === 'object') {
      if (typeof value !== 'object' || value === null) return `${key} must be an object`
    }
  }
  return null
}

export function getAdapter(config: ResolvedWebAuthnConfig): Adapter {
  return createSqliteAdapter(config.dbPath)
}
