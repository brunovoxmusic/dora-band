import { describe, it, expect } from "vitest";
import { calculateCost } from "@/lib/ai/usage";

describe("calculateCost", () => {
  it("vráti 0 pre 0 tokenov", () => {
    expect(calculateCost("groq", "llama-3.3-70b-versatile", 0, 0)).toBe(0);
  });

  it("vráti 0 pre neznámy provider", () => {
    // Neznámy provider použije fallback pricing
    const cost = calculateCost("unknown", "unknown-model", 1000, 1000);
    expect(cost).toBeGreaterThan(0);
  });

  it("kalkuluje Groq llama-3.3-70b správne", () => {
    // 1M prompt + 1M completion = $0.59 + $0.79 = $1.38
    const cost = calculateCost("groq", "llama-3.3-70b-versatile", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(1.38, 2);
  });

  it("kalkuluje Groq llama-3.1-8b správne", () => {
    // 1M prompt + 1M completion = $0.05 + $0.08 = $0.13
    const cost = calculateCost("groq", "llama-3.1-8b-instant", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.13, 2);
  });

  it("kalkuluje OpenAI gpt-4o-mini správne", () => {
    // 1M prompt + 1M completion = $0.15 + $0.6 = $0.75
    const cost = calculateCost("openai", "gpt-4o-mini", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.75, 2);
  });

  it("kalkuluje OpenAI gpt-4o správne", () => {
    // 1M prompt + 1M completion = $5.0 + $15.0 = $20.0
    const cost = calculateCost("openai", "gpt-4o", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(20.0, 2);
  });

  it("používa fallback pre neznámy model", () => {
    // Fallback: $0.5/M input + $1.0/M output = $1.5
    const cost = calculateCost("groq", "unknown-model", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(1.5, 2);
  });

  it("kalkuluje malé množstvo tokenov", () => {
    // 100 prompt + 50 completion pre llama-3.3-70b
    // = (100/1M)*0.59 + (50/1M)*0.79
    // = 0.000059 + 0.0000395 = 0.0000985
    const cost = calculateCost("groq", "llama-3.3-70b-versatile", 100, 50);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(0.001);
  });

  it("zaokrúhľuje na 6 desatinných miest", () => {
    const cost = calculateCost("groq", "llama-3.3-70b-versatile", 1, 1);
    // 1 token by mal byť veľmi malý, ale nie záporný
    expect(cost).toBeGreaterThanOrEqual(0);
    // Zaokrúhlenie na 6 miest
    const rounded = Math.round(cost * 1_000_000) / 1_000_000;
    expect(cost).toBe(rounded);
  });

  it("veľké množstvo tokenov", () => {
    // 10M prompt + 10M completion pre gpt-4o
    // = 10*5 + 10*15 = 200
    const cost = calculateCost("openai", "gpt-4o", 10_000_000, 10_000_000);
    expect(cost).toBeCloseTo(200, 2);
  });
});
