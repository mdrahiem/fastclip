// apps/web/server/rate-limit.ts

import { getEnv } from "./env";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(sessionId: string): boolean {
  const env = getEnv();
  const now = Date.now();
  const hourMs = 3600000;
  const hourBucket = Math.floor(now / hourMs);

  const key = `${sessionId}:${hourBucket}`;
  const entry = rateLimitMap.get(key);

  if (!entry) {
    // New hour bucket, create entry
    rateLimitMap.set(key, {
      count: 1,
      resetTime: (hourBucket + 1) * hourMs,
    });
    return true;
  }

  // Clean up old entries periodically
  if (now > entry.resetTime) {
    rateLimitMap.delete(key);
    rateLimitMap.set(key, {
      count: 1,
      resetTime: (hourBucket + 1) * hourMs,
    });
    return true;
  }

  // Check if under limit
  if (entry.count < env.RATE_LIMIT_JOBS_PER_HOUR) {
    entry.count++;
    return true;
  }

  return false;
}

export function getRateLimitRemaining(sessionId: string): number {
  const env = getEnv();
  const now = Date.now();
  const hourMs = 3600000;
  const hourBucket = Math.floor(now / hourMs);
  const key = `${sessionId}:${hourBucket}`;
  const entry = rateLimitMap.get(key);

  if (!entry) return env.RATE_LIMIT_JOBS_PER_HOUR;

  return Math.max(0, env.RATE_LIMIT_JOBS_PER_HOUR - entry.count);
}
