import { describe, it, expect, vi, beforeEach } from "vitest";
import * as gtag from "@/lib/analytics/gtag";

vi.mock("@/lib/analytics/gtag", async () => {
  const actual = await vi.importActual<typeof gtag>("@/lib/analytics/gtag");
  return { ...actual, trackAddToCart: vi.fn() };
});

import { $cartItems, addToCart, type CartItem } from "./cart";

const sampleItem: CartItem = {
  variantId: "variant-1",
  productSlug: "kopi-arabika",
  productName: "Kopi Arabika",
  variantDescription: "150g, Halus",
  unitPrice: 50000,
  originalPrice: 60000,
  quantity: 1,
  shipWeightGrams: 200,
  image: "/img.jpg",
};

describe("addToCart", () => {
  beforeEach(() => {
    $cartItems.set([]);
    vi.mocked(gtag.trackAddToCart).mockClear();
  });

  it("fires trackAddToCart with the added item", () => {
    addToCart(sampleItem);
    expect(gtag.trackAddToCart).toHaveBeenCalledWith(sampleItem);
  });

  it("fires trackAddToCart with the incoming item even when merging with an existing line", () => {
    addToCart(sampleItem);
    const secondAdd = { ...sampleItem, quantity: 2 };
    addToCart(secondAdd);
    expect(gtag.trackAddToCart).toHaveBeenLastCalledWith(secondAdd);
  });
});
