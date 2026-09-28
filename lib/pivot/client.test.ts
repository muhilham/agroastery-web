import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the pure helper functions exported from the client.
// Token caching and API calls are tested via mocked fetch.

describe("formatPhoneForPivot", () => {
  // Import after vi.mock so we can set up mocks first
  let formatPhoneForPivot: (phone: string) => { countryCode: string; number: string };

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./client");
    formatPhoneForPivot = mod.formatPhoneForPivot;
  });

  it("strips leading 0 from Indonesian mobile number", () => {
    expect(formatPhoneForPivot("08123456789")).toEqual({
      countryCode: "+62",
      number: "8123456789",
    });
  });

  it("strips +62 prefix", () => {
    expect(formatPhoneForPivot("+628123456789")).toEqual({
      countryCode: "+62",
      number: "8123456789",
    });
  });

  it("strips 62 prefix", () => {
    expect(formatPhoneForPivot("628123456789")).toEqual({
      countryCode: "+62",
      number: "8123456789",
    });
  });

  it("passes through bare number unchanged", () => {
    expect(formatPhoneForPivot("8123456789")).toEqual({
      countryCode: "+62",
      number: "8123456789",
    });
  });
});

describe("buildRequestId", () => {
  let buildRequestId: (orderId: string, suffix?: string) => string;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./client");
    buildRequestId = mod.buildRequestId;
  });

  it("produces an alphanumeric string of 16–36 chars", () => {
    const id = buildRequestId("550e8400-e29b-41d4-a716-446655440000");
    expect(id).toMatch(/^[a-z0-9A-Z]+$/);
    expect(id.length).toBeGreaterThanOrEqual(16);
    expect(id.length).toBeLessThanOrEqual(36);
  });

  it("produces a different id when a suffix is given", () => {
    const base = buildRequestId("550e8400-e29b-41d4-a716-446655440000");
    const withSuffix = buildRequestId("550e8400-e29b-41d4-a716-446655440000", "refresh");
    expect(withSuffix).not.toBe(base);
    expect(withSuffix).toMatch(/^[a-z0-9A-Z]+$/);
    expect(withSuffix.length).toBeLessThanOrEqual(36);
  });
});

describe("QRIS session expiry (issue #187)", () => {
  it("QRIS_EXPIRY_MINUTES is 15 (Pivot default; merchant-set, not an upstream hard max)", async () => {
    vi.resetModules();
    const mod = await import("./client");
    expect(mod.QRIS_EXPIRY_MINUTES).toBe(15);
  });

  it("createQrisPaymentSession sends expiryAt ~15 minutes in the future", async () => {
    vi.resetModules();
    let capturedBody: Record<string, unknown> | undefined;
    const mockFetch = vi.fn(async (url: unknown, init?: { body?: string }) => {
      if (String(url).includes("access-token")) {
        return {
          ok: true,
          json: async () => ({
            code: "00",
            data: { accessToken: "fake-token", expiresIn: "900" },
          }),
        };
      }
      capturedBody = JSON.parse(init?.body ?? "{}");
      return {
        ok: true,
        json: async () => ({
          code: "00",
          data: {
            id: "session-1",
            chargeDetails: [
              {
                qr: {
                  qrUrl: "https://qr.example/1",
                  qrString: "000201...",
                  expiryAt: capturedBody
                    ? (capturedBody as { paymentMethodOptions: { qr: { expiryAt: string } } })
                        .paymentMethodOptions.qr.expiryAt
                    : "",
                },
              },
            ],
          },
        }),
      };
    });
    vi.stubGlobal("fetch", mockFetch);
    try {
      const mod = await import("./client");
      const result = await mod.createQrisPaymentSession({
        orderId: "550e8400-e29b-41d4-a716-446655440000",
        orderNumber: "AGR-TEST-1",
        total: 150000,
        customerName: "Test",
        customerEmail: "test@example.com",
        customerPhone: "08123456789",
      });
      const expiryAt = (capturedBody as { paymentMethodOptions: { qr: { expiryAt: string } } })
        .paymentMethodOptions.qr.expiryAt;
      const deltaMs = new Date(expiryAt).getTime() - Date.now();
      // ~15 minutes, with slack for test execution
      expect(deltaMs).toBeGreaterThan(14 * 60 * 1000);
      expect(deltaMs).toBeLessThanOrEqual(15.5 * 60 * 1000);
      expect(result.qrExpiresAt).toBe(expiryAt);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
