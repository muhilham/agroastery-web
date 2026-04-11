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
