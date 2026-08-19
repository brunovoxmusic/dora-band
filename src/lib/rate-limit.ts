/**
 * A.1/A.2 — Rate Limiting Library
 *
 * In-memory rate limiter (Map s IP/userId → timestamps).
 * Pre produkciu s viacerými inštanciami odporúčame @upstash/ratelimit (Redis-backed).
 *
 * Usage:
 *   const limiter = new RateLimiter({ windowMs: 60_000, max: 10 });
 *   const result = limiter.check(identifier);
 *   if (!result.allowed) return Response.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } });
 */

export interface RateLimitOptions {
  /** Časové okno v milisekundách */
  windowMs: number;
  /** Max počet requestov v okne */
  max: number;
  /** Prefix pre identifikátor (napr. "chat", "login") — pre izoláciu rôznych limitov */
  prefix?: string;
  /** Čistenie starých záznamov každých N ms (default: windowMs / 2) */
  cleanupIntervalMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
  resetAt: number;
}

export class RateLimiter {
  private store = new Map<string, number[]>();
  private windowMs: number;
  private max: number;
  private prefix: string;
  private lastCleanup = Date.now();
  private cleanupIntervalMs: number;

  constructor(opts: RateLimitOptions) {
    this.windowMs = opts.windowMs;
    this.max = opts.max;
    this.prefix = opts.prefix || "default";
    this.cleanupIntervalMs = opts.cleanupIntervalMs ?? Math.floor(opts.windowMs / 2);
  }

  /**
   * Skontroluje či identifikátor (IP/userId) môže urobiť request.
   * Vráti result s allowed flagom a metadátami.
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const key = `${this.prefix}:${identifier}`;

    // Periodické čistenie starých záznamov (memory leak prevention)
    if (now - this.lastCleanup > this.cleanupIntervalMs) {
      this.cleanup(now);
      this.lastCleanup = now;
    }

    const timestamps = this.store.get(key) || [];
    // Filtruj len timestampy v rámci okna
    const valid = timestamps.filter((t) => now - t < this.windowMs);

    if (valid.length >= this.max) {
      // Limit prekročený — vráť retry-after (najstarší timestamp + window)
      const oldest = valid[0];
      const resetAt = oldest + this.windowMs;
      return {
        allowed: false,
        remaining: 0,
        retryAfterSec: Math.ceil((resetAt - now) / 1000),
        resetAt,
      };
    }

    // Pridaj aktuálny timestamp
    valid.push(now);
    this.store.set(key, valid);

    return {
      allowed: true,
      remaining: this.max - valid.length,
      retryAfterSec: 0,
      resetAt: now + this.windowMs,
    };
  }

  /** Vyčisti staré záznamy z pamäte */
  private cleanup(now: number): void {
    for (const [key, timestamps] of this.store.entries()) {
      const valid = timestamps.filter((t) => now - t < this.windowMs);
      if (valid.length === 0) {
        this.store.delete(key);
      } else if (valid.length !== timestamps.length) {
        this.store.set(key, valid);
      }
    }
  }

  /** Manuálne reset limitu pre identifikátor (napr. po úspešnej akcii) */
  reset(identifier: string): void {
    const key = `${this.prefix}:${identifier}`;
    this.store.delete(key);
  }
}

// =====================================================
// PRESETS — preddefinované limitery pre rôzne endpointy
// =====================================================

/** Chat API: 10 správ za hodinu na IP (anti cost abuse) */
export const chatRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  prefix: "chat",
});

/** Login API: 5 pokusov za 15 minút (anti brute-force) */
export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  prefix: "login",
});

/** Booking API: 3 dopyty za hodinu na IP (anti spam) */
export const bookingRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  prefix: "booking",
});

/** Newsletter API: 3 prihlásenia za hodinu na IP (anti spam) */
export const newsletterRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  prefix: "newsletter",
});

/** Pomocná funkcia: Extrahuj IP z Next.js requestu */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/** Pomocná funkcia: Vráť 429 response s vhodnými hlavičkami */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Príliš veľa požiadaviek. Skúste to neskôr.",
      retryAfter: result.retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSec),
        "X-RateLimit-Limit": String(result.allowed ? result.remaining + 1 : result.remaining),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    }
  );
}
