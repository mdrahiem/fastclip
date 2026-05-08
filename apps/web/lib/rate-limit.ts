/** Simple sliding-window-ish in-memory rate limiter (single process only). */

type Bucket = { count: number; windowStartMs: number };

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  max: number;
  windowMs: number;
};

/** Returns `{ ok: true }` if under limit; otherwise resets after window expiry. */
export function checkRateLimit(
  key: string,
  { max, windowMs }: RateLimitOptions,
): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStartMs >= windowMs) {
    bucket = { count: 0, windowStartMs: now };
    buckets.set(key, bucket);
  }
  if (bucket.count >= max) {
    const retryAfterSec = Math.ceil(
      (bucket.windowStartMs + windowMs - now) / 1000,
    );
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  bucket.count += 1;
  return { ok: true };
}
