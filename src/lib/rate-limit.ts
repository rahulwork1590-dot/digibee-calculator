import "server-only";

// in-memory limiter, fine for a single instance. swap for Redis if we scale out.

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_HITS = 20;

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (bucket.count >= MAX_HITS) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}

// drop expired buckets so the map doesn't grow forever
export function sweepRateLimit(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}
