import { describe, it, expect } from "vitest";
import { isShippingCostInvalid } from "./validateShippingCost";

describe("isShippingCostInvalid", () => {
  it("flags zero cost with a courier and nonzero weight for delivery orders", () => {
    const result = isShippingCostInvalid({
      fulfillmentMethod: "delivery",
      shippingCost: 0,
      shippingCourier: "jne",
      totalShipWeight: 500,
    });
    expect(result).toBe(true);
  });

  it("allows a legitimate positive shipping cost for delivery orders", () => {
    const result = isShippingCostInvalid({
      fulfillmentMethod: "delivery",
      shippingCost: 15000,
      shippingCourier: "jne",
      totalShipWeight: 500,
    });
    expect(result).toBe(false);
  });

  it("never flags pickup orders even with zero cost, a courier value, and weight", () => {
    const result = isShippingCostInvalid({
      fulfillmentMethod: "pickup",
      shippingCost: 0,
      shippingCourier: "pickup",
      totalShipWeight: 500,
    });
    expect(result).toBe(false);
  });

  it("allows zero cost for delivery when there is no courier selected yet", () => {
    const result = isShippingCostInvalid({
      fulfillmentMethod: "delivery",
      shippingCost: 0,
      shippingCourier: undefined,
      totalShipWeight: 500,
    });
    expect(result).toBe(false);
  });
});
