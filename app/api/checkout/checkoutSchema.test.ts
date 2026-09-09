import { describe, it, expect } from "vitest";
import { CheckoutSchema } from "./checkoutSchema";

const baseItems = [{ variantId: "11111111-1111-1111-1111-111111111111", quantity: 1 }];

describe("CheckoutSchema", () => {
  it("defaults fulfillmentMethod to delivery when omitted", () => {
    const result = CheckoutSchema.safeParse({
      items: baseItems,
      customerName: "Budi",
      customerPhone: "081234567890",
      shippingAddress: { recipientName: "Budi", phone: "081234567890", addressLine: "Jl. Contoh No. 1" },
      shippingCourier: "jne",
      shippingService: "reg",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fulfillmentMethod).toBe("delivery");
  });

  it("rejects a delivery payload without courier+service (issue #138 re-quote contract)", () => {
    const result = CheckoutSchema.safeParse({
      items: baseItems,
      customerName: "Budi",
      customerPhone: "081234567890",
      shippingAddress: { recipientName: "Budi", phone: "081234567890", addressLine: "Jl. Contoh No. 1" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["shippingCourier"]);
    }
  });

  it("accepts a pickup payload with no postalCode/latitude/longitude", () => {
    const result = CheckoutSchema.safeParse({
      items: baseItems,
      customerName: "Budi",
      customerPhone: "081234567890",
      fulfillmentMethod: "pickup",
      shippingAddress: {
        recipientName: "Budi",
        phone: "081234567890",
        addressLine: "Jl. Roastery No. 1, Jakarta Selatan",
        hours: "Senin-Sabtu, 09:00-17:00 WIB",
      },
      shippingCourier: "pickup",
      shippingCost: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.shippingAddress.hours).toBe("Senin-Sabtu, 09:00-17:00 WIB");
  });

  it("rejects an unknown fulfillmentMethod value", () => {
    const result = CheckoutSchema.safeParse({
      items: baseItems,
      customerName: "Budi",
      customerPhone: "081234567890",
      fulfillmentMethod: "teleport",
      shippingAddress: { recipientName: "Budi", phone: "081234567890", addressLine: "Jl. Contoh No. 1" },
    });
    expect(result.success).toBe(false);
  });
});
