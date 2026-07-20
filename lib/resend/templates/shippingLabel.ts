export function getShippingLabel(
  shippingCourier?: string | null,
  shippingService?: string | null
): string {
  if (shippingCourier === "pickup") return "Ambil Sendiri";
  if (shippingCourier && shippingService) return `${shippingCourier.toUpperCase()} ${shippingService}`;
  if (shippingCourier) return shippingCourier.toUpperCase();
  return "Courier";
}

export function getShippingHeading(shippingCourier?: string | null): string {
  return shippingCourier === "pickup" ? "Pickup at" : "Shipping to";
}

export function getTrackingCtaLabel(shippingCourier?: string | null): string {
  return shippingCourier === "pickup" ? "Lihat Info Pengambilan →" : "Track My Order →";
}
