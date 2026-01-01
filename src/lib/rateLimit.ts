import { NextRequest, NextResponse } from 'next/server';

type LimitConfig = {
  windowMs: number; // time window in ms
  max: number; // max requests per window per key
};

type Entry = {
  count: number;
  resetAt: number;
};

// Simple in-memory rate limiter for single-instance deployments.
const store = new Map<string, Entry>();

function getClientKey(req: NextRequest, bucket: string): string {
  const ip =
    (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()) ||
    req.headers.get('x-real-ip') ||
    'unknown';

  return `${bucket}:${ip}`;
}

/**
 * In-memory rate limit check.
 */
function checkRateLimitMemory(
  key: string,
  max: number,
  windowMs: number
): { ok: boolean; current: number; limit: number; resetAt: number } {
  const now = Date.now();

  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    // start a new window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, current: 1, limit: max, resetAt: now + windowMs };
  }

  if (current.count >= max) {
    return { ok: false, current: current.count, limit: max, resetAt: current.resetAt };
  }

  current.count += 1;
  store.set(key, current);
  return { ok: true, current: current.count, limit: max, resetAt: current.resetAt };
}

export function checkRateLimit(
  req: NextRequest,
  config: LimitConfig,
  bucket: string
): { ok: boolean; response?: NextResponse; headers?: Record<string, string> } {
  const key = getClientKey(req, bucket);

  const result = checkRateLimitMemory(key, config.max, config.windowMs);
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.limit - result.current)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.ok) {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    const res = NextResponse.json(
      {
        error: 'Too many requests, please slow down.',
      },
      {
        status: 429,
      }
    );

    res.headers.set('Retry-After', String(retryAfterSeconds));
    Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));

    return { ok: false, response: res };
  }

  return { ok: true, headers };
}
