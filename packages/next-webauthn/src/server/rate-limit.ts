export interface RateLimitConfig {
  maxRequests?: number
  windowMs?: number
}

export function createRateLimiter(config?: RateLimitConfig) {
  const maxRequests = config?.maxRequests ?? 5
  const windowMs = config?.windowMs ?? 60000
  const store = new Map<string, { count: number; resetAt: number }>()

  const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of store) {
      if (entry.resetAt <= now) store.delete(ip)
    }
  }, 60000)
  if (cleanup.unref) cleanup.unref()

  function check(ip: string) {
    const now = Date.now()
    const entry = store.get(ip)
    if (!entry || entry.resetAt <= now) {
      const resetAt = now + windowMs
      store.set(ip, { count: 1, resetAt })
      return { allowed: true, remaining: maxRequests - 1, resetTime: resetAt }
    }
    if (entry.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: entry.resetAt }
    }
    entry.count++
    return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetAt }
  }

  return { check }
}
