import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { consumeRate, retryAfterSeconds, RATE_LIMIT_PER_MIN, __resetRateBuckets } from "./proxyGuard";

describe("proxyGuard consumeRate (#154)", () => {
  beforeEach(() => __resetRateBuckets());

  it("allows up to the limit for one IP, then rejects", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_PER_MIN; i++) {
      expect(consumeRate("1.1.1.1", t0 + i)).toBe(true);
    }
    expect(consumeRate("1.1.1.1", t0 + 59_999)).toBe(false);
  });

  it("tracks IPs independently", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_PER_MIN; i++) consumeRate("1.1.1.1", t0 + i);
    expect(consumeRate("2.2.2.2", t0)).toBe(true);
  });

  it("window slides: old hits expire", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_PER_MIN; i++) consumeRate("9.9.9.9", t0 + i);
    expect(consumeRate("9.9.9.9", t0 + 61_000)).toBe(true); // first 1000ms rolled out
  });

  it("retryAfter is positive and shrinks as the window rolls", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_PER_MIN; i++) consumeRate("3.3.3.3", t0 + i);
    expect(retryAfterSeconds("3.3.3.3", t0 + 1_000)).toBe(59);
    expect(retryAfterSeconds("3.3.3.3", t0 + 90_000)).toBeLessThan(31);
  });
});
