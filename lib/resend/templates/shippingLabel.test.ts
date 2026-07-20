import { describe, it, expect } from "vitest";
import { getShippingLabel, getShippingHeading, getTrackingCtaLabel } from "./shippingLabel";

describe("getShippingLabel", () => {
  it("returns 'Ambil Sendiri' for pickup orders regardless of service", () => {
    expect(getShippingLabel("pickup", undefined)).toBe("Ambil Sendiri");
  });

  it("returns 'COURIER SERVICE' when both are present", () => {
    expect(getShippingLabel("jne", "REG")).toBe("JNE REG");
  });

  it("falls back to just the courier name when service is missing", () => {
    expect(getShippingLabel("jne", undefined)).toBe("JNE");
  });

  it("falls back to 'Courier' when nothing is set", () => {
    expect(getShippingLabel(undefined, undefined)).toBe("Courier");
  });
});

describe("getShippingHeading", () => {
  it("returns 'Pickup at' for pickup orders", () => {
    expect(getShippingHeading("pickup")).toBe("Pickup at");
  });

  it("returns 'Shipping to' for delivery orders", () => {
    expect(getShippingHeading("jne")).toBe("Shipping to");
  });
});

describe("getTrackingCtaLabel", () => {
  it("returns the pickup CTA label for pickup orders", () => {
    expect(getTrackingCtaLabel("pickup")).toBe("Lihat Info Pengambilan →");
  });

  it("returns the default CTA label for delivery orders", () => {
    expect(getTrackingCtaLabel("jne")).toBe("Track My Order →");
  });
});
