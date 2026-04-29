import type { Discount, DiscountResult } from "@/types/discount";

function applyDiscount(price: number, discount: Discount): number {
  if (discount.type === "percentage") {
    return price - Math.floor(price * discount.value / 100);
  }
  return price - discount.value;
}

export function calculateDiscountedPrice(
  originalPrice: number,
  productDiscounts: Discount[],
  globalDiscounts: Discount[]
): DiscountResult {
  const activeProductDiscounts = productDiscounts.filter((d) => d.is_active);
  const activeGlobalDiscounts = globalDiscounts.filter((d) => d.is_active);

  if (activeProductDiscounts.length === 0 && activeGlobalDiscounts.length === 0) {
    return { discountedPrice: originalPrice, hasDiscount: false };
  }

  let price = originalPrice;

  // Apply product discounts first
  for (const discount of activeProductDiscounts) {
    price = Math.max(0, applyDiscount(price, discount));
  }

  // Then apply global discounts
  for (const discount of activeGlobalDiscounts) {
    price = Math.max(0, applyDiscount(price, discount));
  }

  return { discountedPrice: price, hasDiscount: price !== originalPrice };
}
