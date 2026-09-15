// Tiny in-memory token-bucket limiter to throttle certificate-verification
// enumeration. Per-process only (fine for a single dev/edge node); it degrades
// open (returns true) if anything unexpected happens so the page never crashes.

type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

/**
 * Returns true when the action for `key` is allowed. Refills `limit` tokens
 * every `windowMs`. Never throws.
 */
export function rateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  try {
    const now = Date.now();

    // Occasional sweep so idle keys don't leak memory.
    if (now - lastSweep > windowMs * 5) {
      for (const [k, b] of buckets) if (now - b.updatedAt > windowMs * 5) buckets.delete(k);
      lastSweep = now;
    }

    const refillRate = limit / windowMs; // tokens per ms
    const existing = buckets.get(key);
    const bucket: Bucket = existing ?? { tokens: limit, updatedAt: now };
    if (existing) {
      const elapsed = now - bucket.updatedAt;
      bucket.tokens = Math.min(limit, bucket.tokens + elapsed * refillRate);
      bucket.updatedAt = now;
    }

    if (bucket.tokens < 1) {
      buckets.set(key, bucket);
      return false;
    }
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return true;
  } catch {
    return true; // degrade open — throttling must never break the page
  }
}

/** Read a client IP from forwarded headers, falling back to a shared key. */
export function clientIp(headers: Headers): string {
  try {
    const fwd = headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]!.trim();
    return headers.get("x-real-ip")?.trim() || "unknown";
  } catch {
    return "unknown";
  }
}
