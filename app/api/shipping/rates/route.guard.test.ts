/**
 * Issue #154 A — the public rates proxy must not remain an open Biteship
 * relay: per-IP 429, foreign-origin 403, oversized 413, bad postal 400.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { __resetRateBuckets, RATE_LIMIT_PER_MIN } from "@/lib/api/proxyGuard";

const fetchMock = vi.fn();

function req(body: unknown, ip = "5.5.5.5"): Request {
  return new Request("http://localhost/api/shipping/rates", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const okPayload = (origin = 12440) => ({
  origin_postal_code: origin,
  destination_postal_code: 40115,
  couriers: "jne",
  items: [{ name: "Kopi", value: 1000, weight: 1000, quantity: 1, length: 20, width: 15, height: 10 }],
});

describe("POST /api/shipping/rates guards", () => {
  beforeEach(() => {
    __resetRateBuckets();
    vi.stubEnv("BITESHIP_API_KEY", "test_key");
    fetchMock.mockClear();
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: true, pricing: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("proxies a legit request", async () => {
    const res = await POST(req(okPayload(), "8.8.8.0"));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("429 after the per-IP budget with Retry-After", async () => {
    let last;
    for (let i = 0; i <= RATE_LIMIT_PER_MIN; i++) {
      last = await POST(req(okPayload(), "6.6.6.6"));
    }
    expect(last!.status).toBe(429);
    expect(Number(last!.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("different IPs get their own budget", async () => {
    for (let i = 0; i < RATE_LIMIT_PER_MIN; i++) await POST(req(okPayload(), "7.7.7.1"));
    const res = await POST(req(okPayload(), "7.7.7.2"));
    expect(res.status).toBe(200);
  });

  it("client cannot reset its budget by rotating a spoofed first hop", async () => {
    // Attacker forges the leftmost XFF entry; the edge-appended LAST hop is
    // what identifies them. First hop must be ignored for bucketing.
    let last;
    for (let i = 0; i <= RATE_LIMIT_PER_MIN; i++) {
      last = await POST(req(okPayload(), `1.2.3.${i}, 51.51.51.51`));
    }
    expect(last!.status).toBe(429);
  });

  it("same real IP behind different chains shares one budget", async () => {
    await POST(req(okPayload(), "9.9.9.1, 60.60.60.60"));
    for (let i = 0; i < RATE_LIMIT_PER_MIN - 1; i++) {
      await POST(req(okPayload(), `8.8.8.${i}, 60.60.60.60`));
    }
    const res = await POST(req(okPayload(), "7.7.7.7, 60.60.60.60"));
    expect(res.status).toBe(429);
  });

  it("413 when content-length claims an oversized body (before buffering)", async () => {
    const r = new Request("http://localhost/api/shipping/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "61.61.61.61", "content-length": "999999" },
      body: JSON.stringify(okPayload()),
    });
    const res = await POST(r);
    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("403 for a foreign origin postal", async () => {
    const res = await POST(req(okPayload(99999), "8.8.8.1"));
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("413 for oversized bodies before any upstream call", async () => {
    const huge = {
      ...okPayload(),
      items: Array.from({ length: 600 }, () => ({
        name: "x".repeat(60), value: 1, weight: 1000, quantity: 1, length: 20, width: 15, height: 10,
      })),
    };
    const res = await POST(req(huge, "8.8.8.2"));
    expect(res.status === 413 || res.status === 400).toBe(true); // size cap or zod max(50) items
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("400 for blank destination postal (Number('') trap, #139 lesson)", async () => {
    const res = await POST(req({ ...okPayload(), destination_postal_code: "" }, "8.8.8.3"));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
