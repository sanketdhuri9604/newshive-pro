import { NextRequest, NextResponse } from 'next/server'

// ─── In-memory rate limiter ─────────────────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Returns a 429 response if the client has exceeded the rate limit, or null if OK.
 */
export function checkRateLimit(req: NextRequest): NextResponse | null {
  const ip = getClientIp(req)
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return null
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  entry.count++
  return null
}

// Periodically clean expired entries
if (typeof globalThis !== 'undefined') {
  const cleanup = () => {
    const now = Date.now()
    rateLimitStore.forEach((value, key) => {
      if (now > value.resetAt) rateLimitStore.delete(key)
    })
  }
  // Run cleanup every 5 minutes
  if (typeof setInterval !== 'undefined') {
    setInterval(cleanup, 5 * 60_000)
  }
}

// ─── Input sanitization ─────────────────────────────────────────────────────
/**
 * Sanitize user input before passing to LLM prompts.
 * Truncates to maxLength and removes control characters.
 */
export function sanitizeInput(text: string, maxLength: number = 5000): string {
  if (!text || typeof text !== 'string') return ''
  return text
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // strip control chars
}
