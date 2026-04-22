import { describe, it, expect } from "vitest";
import { calculateDiscountedPrice } from "@/lib/utils/discount";
import type { Discount } from "@/types/discount";

describe("calculateDiscountedPrice", () => {
  it("returns original price when no discounts", () => {
    const result = calculateDiscountedPrice(100000, [], []);
    expect(result).toEqual({ discountedPrice: 100000, hasDiscount: false });
  });

  it("applies a single percentage product discount", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Promo", type: "percentage", value: 10, is_active: true },
    ];
    const result = calculateDiscountedPrice(100000, productDiscounts, []);
    expect(result).toEqual({ discountedPrice: 90000, hasDiscount: true });
  });

  it("applies a single nominal product discount", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Promo", type: "nominal", value: 15000, is_active: true },
    ];
    const result = calculateDiscountedPrice(100000, productDiscounts, []);
    expect(result).toEqual({ discountedPrice: 85000, hasDiscount: true });
  });

  it("applies a single percentage global discount", () => {
    const globalDiscounts: Discount[] = [
      { id: "2", name: "Global Sale", type: "percentage", value: 25, is_active: true },
    ];
    const result = calculateDiscountedPrice(100000, [], globalDiscounts);
    expect(result).toEqual({ discountedPrice: 75000, hasDiscount: true });
  });

  it("applies a single nominal global discount", () => {
    const globalDiscounts: Discount[] = [
      { id: "2", name: "Global Voucher", type: "nominal", value: 30000, is_active: true },
    ];
    const result = calculateDiscountedPrice(100000, [], globalDiscounts);
    expect(result).toEqual({ discountedPrice: 70000, hasDiscount: true });
  });

  it("stacks product discount then global discount sequentially", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Product Promo", type: "percentage", value: 10, is_active: true },
    ];
    const globalDiscounts: Discount[] = [
      { id: "2", name: "Global Promo", type: "nominal", value: 5000, is_active: true },
    ];
    // 100000 → 90000 (10% off) → 85000 (5000 off)
    const result = calculateDiscountedPrice(100000, productDiscounts, globalDiscounts);
    expect(result).toEqual({ discountedPrice: 85000, hasDiscount: true });
  });

  it("stacks multiple product discounts sequentially", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Promo A", type: "percentage", value: 10, is_active: true },
      { id: "2", name: "Promo B", type: "nominal", value: 5000, is_active: true },
    ];
    // 100000 → 90000 (10% off) → 85000 (5000 off)
    const result = calculateDiscountedPrice(100000, productDiscounts, []);
    expect(result).toEqual({ discountedPrice: 85000, hasDiscount: true });
  });

  it("floors price at 0 when discount exceeds price", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Big Promo", type: "nominal", value: 200000, is_active: true },
    ];
    const result = calculateDiscountedPrice(100000, productDiscounts, []);
    expect(result).toEqual({ discountedPrice: 0, hasDiscount: true });
  });

  it("uses floor for percentage calculation (no fractional IDR)", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Promo", type: "percentage", value: 33, is_active: true },
    ];
    // floor(100000 * 33 / 100) = floor(33000) = 33000
    // 100000 - 33000 = 67000
    const result = calculateDiscountedPrice(100000, productDiscounts, []);
    expect(result).toEqual({ discountedPrice: 67000, hasDiscount: true });
  });

  it("filters out inactive discounts", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Inactive", type: "percentage", value: 50, is_active: false },
    ];
    const result = calculateDiscountedPrice(100000, productDiscounts, []);
    expect(result).toEqual({ discountedPrice: 100000, hasDiscount: false });
  });

  it("applies only active global discounts when mixed with inactive", () => {
    const globalDiscounts: Discount[] = [
      { id: "1", name: "Expired Sale", type: "percentage", value: 50, is_active: false },
      { id: "2", name: "Active Sale", type: "nominal", value: 10000, is_active: true },
    ];
    const result = calculateDiscountedPrice(100000, [], globalDiscounts);
    expect(result).toEqual({ discountedPrice: 90000, hasDiscount: true });
  });

  it("applies only active product discounts when mixed with inactive", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Old Promo", type: "nominal", value: 50000, is_active: false },
      { id: "2", name: "New Promo", type: "percentage", value: 15, is_active: true },
    ];
    const result = calculateDiscountedPrice(100000, productDiscounts, []);
    // 100000 - 15% = 85000
    expect(result).toEqual({ discountedPrice: 85000, hasDiscount: true });
  });
});
