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

describe("QRIS session expiry (issue #221)", () => {
  it("QRIS_EXPIRY_MINUTES is 60", async () => {
    vi.resetModules();
    const mod = await import("./client");
    expect(mod.QRIS_EXPIRY_MINUTES).toBe(60);
  });

  it("createQrisPaymentSession sends matching expiryAt values ~60 minutes in the future", async () => {
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
      expect(deltaMs).toBeGreaterThan(59 * 60 * 1000);
      expect(deltaMs).toBeLessThanOrEqual(60.5 * 60 * 1000);
      expect((capturedBody as { expiryAt: string }).expiryAt).toBe(expiryAt);
      expect(result.qrExpiresAt).toBe(expiryAt);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("throws when Pivot omits the conditional QR expiryAt", async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn(async (url: unknown) => String(url).includes("access-token")
      ? { ok: true, json: async () => ({ code: "00", data: { accessToken: "token", expiresIn: "900" } }) }
      : { ok: true, json: async () => ({ code: "00", data: { id: "session-1", chargeDetails: [{ qr: { qrUrl: "https://qr.example/1" } }] } }) }
    ));
    try {
      const { createQrisPaymentSession } = await import("./client");
      await expect(createQrisPaymentSession({ orderId: "550e8400-e29b-41d4-a716-446655440000", orderNumber: "AGR-1", total: 1, customerName: "Test", customerPhone: "08123456789" })).rejects.toThrow("Pivot response missing qr.expiryAt");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("returns Pivot's QR acquirer", async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn(async (url: unknown) => String(url).includes("access-token")
      ? { ok: true, json: async () => ({ code: "00", data: { accessToken: "token", expiresIn: "900" } }) }
      : { ok: true, json: async () => ({ code: "00", data: { id: "session-1", chargeDetails: [{ qr: { qrUrl: "https://qr.example/1", qrString: "000201", expiryAt: "2026-01-01T00:00:00.000Z", acquirer: "BRI" } }] } }) }
    ));
    try {
      const { createQrisPaymentSession } = await import("./client");
      const result = await createQrisPaymentSession({ orderId: "550e8400-e29b-41d4-a716-446655440000", orderNumber: "AGR-1", total: 1, customerName: "Test", customerPhone: "08123456789" });
      expect(result.acquirer).toBe("BRI");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("returns null when Pivot omits the QR acquirer", async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn(async (url: unknown) => String(url).includes("access-token")
      ? { ok: true, json: async () => ({ code: "00", data: { accessToken: "token", expiresIn: "900" } }) }
      : { ok: true, json: async () => ({ code: "00", data: { id: "session-1", chargeDetails: [{ qr: { qrUrl: "https://qr.example/1", qrString: "000201", expiryAt: "2026-01-01T00:00:00.000Z" } }] } }) }
    ));
    try {
      const { createQrisPaymentSession } = await import("./client");
      const result = await createQrisPaymentSession({ orderId: "550e8400-e29b-41d4-a716-446655440000", orderNumber: "AGR-1", total: 1, customerName: "Test", customerPhone: "08123456789" });
      expect(result.acquirer).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
