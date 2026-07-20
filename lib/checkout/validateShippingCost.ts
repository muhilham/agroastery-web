/**
 * True when a delivery order's shipping cost looks wrong: zero cost despite
 * a chosen courier and nonzero package weight. Pickup orders are exempt —
 * zero cost with shippingCourier="pickup" is the correct, expected state.
 */
export function isShippingCostInvalid(params: {
  fulfillmentMethod: "delivery" | "pickup";
  shippingCost: number;
  shippingCourier?: string;
  totalShipWeight: number;
}): boolean {
  if (params.fulfillmentMethod === "pickup") return false;
  return params.shippingCost === 0 && Boolean(params.shippingCourier) && params.totalShipWeight > 0;
}
