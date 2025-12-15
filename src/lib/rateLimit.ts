import { NextRequest, NextResponse } from 'next/server';

type LimitConfig = {
  windowMs: number; // time window in ms
  max: number; // max requests per window per key
};

type Entry = {
  count: number;
  resetAt: number;
};

// Simple in-memory rate limiter.
// NOTE: This is per-process and best-effort only. For a
// horizontally scaled or serverless deployment you should
// back this with Redis (e.g. Upstash) or another shared store.
const store = new Map<string, Entry>();

function getClientKey(req: NextRequest, bucket: string): string {
  const ip =
    (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()) ||
    req.headers.get('x-real-ip') ||
    'unknown';

  return `${bucket}:${ip}`;
}

export function checkRateLimit(
  req: NextRequest,
  config: LimitConfig,
  bucket: string
): { ok: boolean; response?: NextResponse } {
  const key = getClientKey(req, bucket);
  const now = Date.now();

  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    // start a new window
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { ok: true };
  }

  if (current.count >= config.max) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000)
    );

    const res = NextResponse.json(
      {
        error: 'Too many requests, please slow down.',
      },
      {
        status: 429,
      }
    );

    res.headers.set('Retry-After', String(retryAfterSeconds));

    return { ok: false, response: res };
  }

  current.count += 1;
  store.set(key, current);
  return { ok: true };
}
