import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

type MemoryEntry = { count: number; reset: number };

const globalForLimit = globalThis as unknown as {
  __sfhMemoryLimits?: Map<string, MemoryEntry>;
  __sfhUpstashLimits?: Map<string, Ratelimit>;
  __sfhRedis?: Redis;
};

const memory =
  globalForLimit.__sfhMemoryLimits ??
  (globalForLimit.__sfhMemoryLimits = new Map<string, MemoryEntry>());

function upstashConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function getUpstash(limit: number, windowMs: number) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  const cache =
    globalForLimit.__sfhUpstashLimits ??
    (globalForLimit.__sfhUpstashLimits = new Map<string, Ratelimit>());
  const key = `${limit}:${windowMs}`;
  const existing = cache.get(key);
  if (existing) return existing;

  const redis =
    globalForLimit.__sfhRedis ??
    (globalForLimit.__sfhRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }));

  const instance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
    prefix: "sfh-ratelimit",
    analytics: false,
  });
  cache.set(key, instance);
  return instance;
}

/**
 * Rate limit a key. Uses Upstash when configured; otherwise an in-memory
 * fallback (fine for local dev, but per-instance on serverless — use Upstash
 * in production).
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const rl = getUpstash(limit, windowMs);
  if (rl) {
    try {
      const result = await rl.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch {
      // Fall through to the in-memory limiter if Redis is unreachable.
    }
  }

  const now = Date.now();
  if (memory.size > 5000) {
    for (const [key, entry] of memory) {
      if (entry.reset < now) memory.delete(key);
    }
  }

  const entry = memory.get(identifier);
  if (!entry || entry.reset < now) {
    memory.set(identifier, { count: 1, reset: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }
  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: entry.reset };
  }
  entry.count += 1;
  return { success: true, remaining: limit - entry.count, reset: entry.reset };
}

export function rateLimitConfigured() {
  return upstashConfigured();
}
