import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter } from "@/lib/rate-limit";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      windowMs: 1000, // 1 sekunda pre testy
      max: 3,
      prefix: "test",
    });
  });

  it("povolí prvý request", () => {
    const result = limiter.check("ip1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("povolí requesty do limitu", () => {
    expect(limiter.check("ip1").allowed).toBe(true);
    expect(limiter.check("ip1").allowed).toBe(true);
    expect(limiter.check("ip1").allowed).toBe(true);
  });

  it("zamietne request nad limit", () => {
    limiter.check("ip1");
    limiter.check("ip1");
    limiter.check("ip1");
    const result = limiter.check("ip1");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("vráti retryAfterSec keď zamietne", () => {
    limiter.check("ip1");
    limiter.check("ip1");
    limiter.check("ip1");
    const result = limiter.check("ip1");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSec).toBeGreaterThan(0);
    expect(result.retryAfterSec).toBeLessThanOrEqual(1);
  });

  it("izoluje rôzne identifikátory", () => {
    limiter.check("ip1");
    limiter.check("ip1");
    limiter.check("ip1");
    // ip2 by mal mať vlastný limit
    const result = limiter.check("ip2");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("reset() vymaže limit pre identifikátor", () => {
    limiter.check("ip1");
    limiter.check("ip1");
    limiter.check("ip1");
    expect(limiter.check("ip1").allowed).toBe(false);
    limiter.reset("ip1");
    const result = limiter.check("ip1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("remaining sa dekrementuje", () => {
    expect(limiter.check("ip1").remaining).toBe(2);
    expect(limiter.check("ip1").remaining).toBe(1);
    expect(limiter.check("ip1").remaining).toBe(0);
  });

  it("používa prefix pre izoláciu", () => {
    const limiter1 = new RateLimiter({ windowMs: 1000, max: 1, prefix: "a" });
    const limiter2 = new RateLimiter({ windowMs: 1000, max: 1, prefix: "b" });
    // rovnaký identifikátor, ale rôzne prefixy
    expect(limiter1.check("ip1").allowed).toBe(true);
    expect(limiter2.check("ip1").allowed).toBe(true);
  });
});
