import { describe, it, expect, afterEach, vi } from "vitest";
import { sendGAEvent } from "@next/third-parties/google";
import {
  trackEvent,
  cartItemToGA4,
  trackViewItem,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackBookConsultation,
} from "./gtag";
import type { CartItem } from "@/lib/stores/cart";

vi.mock("@next/third-parties/google", () => ({
  sendGAEvent: vi.fn(),
}));

const sampleItem: CartItem = {
  variantId: "variant-1",
  productSlug: "kopi-arabika",
  productName: "Kopi Arabika",
  variantDescription: "150g, Halus",
  unitPrice: 50000,
  originalPrice: 60000,
  quantity: 2,
  shipWeightGrams: 200,
  image: "/img.jpg",
};

describe("gtag wrapper", () => {
  afterEach(() => {
    vi.mocked(sendGAEvent).mockClear();
  });

  describe("trackEvent", () => {
    it("does not throw when window is undefined (SSR)", () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error — simulating SSR by removing window
      globalThis.window = undefined;
      expect(() => trackEvent("test_event", { foo: "bar" })).not.toThrow();
      globalThis.window = originalWindow;
    });

    it("calls sendGAEvent with event name and params", () => {
      trackEvent("test_event", { foo: "bar" });
      expect(sendGAEvent).toHaveBeenCalledWith("test_event", { foo: "bar" });
    });
  });

  describe("cartItemToGA4", () => {
    it("maps CartItem fields to the GA4 item shape", () => {
      expect(cartItemToGA4(sampleItem)).toEqual({
        item_id: "variant-1",
        item_name: "Kopi Arabika",
        price: 50000,
        quantity: 2,
      });
    });
  });

  describe("trackViewItem", () => {
    it("fires view_item with a single-item payload", () => {
      trackViewItem({ itemId: "variant-1", itemName: "Kopi Arabika", price: 50000 });
      expect(sendGAEvent).toHaveBeenCalledWith("view_item", {
        currency: "IDR",
        value: 50000,
        items: [{ item_id: "variant-1", item_name: "Kopi Arabika", price: 50000, quantity: 1 }],
      });
    });
  });

  describe("trackAddToCart", () => {
    it("fires add_to_cart with value = unitPrice * quantity", () => {
      trackAddToCart(sampleItem);
      expect(sendGAEvent).toHaveBeenCalledWith("add_to_cart", {
        currency: "IDR",
        value: 100000,
        items: [{ item_id: "variant-1", item_name: "Kopi Arabika", price: 50000, quantity: 2 }],
      });
    });
  });

  describe("trackBeginCheckout", () => {
    it("fires begin_checkout with summed value across items", () => {
      const items: CartItem[] = [
        sampleItem,
        { ...sampleItem, variantId: "variant-2", productName: "Kopi Robusta", unitPrice: 30000, quantity: 1 },
      ];
      trackBeginCheckout(items);
      expect(sendGAEvent).toHaveBeenCalledWith("begin_checkout", {
        currency: "IDR",
        value: 130000,
        items: [
          { item_id: "variant-1", item_name: "Kopi Arabika", price: 50000, quantity: 2 },
          { item_id: "variant-2", item_name: "Kopi Robusta", price: 30000, quantity: 1 },
        ],
      });
    });
  });

  describe("trackPurchase", () => {
    it("fires purchase with transaction_id, shipping, and mapped items", () => {
      trackPurchase({
        transactionId: "AGR-20260730-0001",
        value: 115000,
        shipping: 15000,
        items: [{ itemId: "variant-1", itemName: "Kopi Arabika", price: 50000, quantity: 2 }],
      });
      expect(sendGAEvent).toHaveBeenCalledWith("purchase", {
        transaction_id: "AGR-20260730-0001",
        currency: "IDR",
        value: 115000,
        shipping: 15000,
        items: [{ item_id: "variant-1", item_name: "Kopi Arabika", price: 50000, quantity: 2 }],
      });
    });
  });

  describe("trackBookConsultation", () => {
    it("fires book_consultation with currency and value", () => {
      trackBookConsultation({ value: 500000 });
      expect(sendGAEvent).toHaveBeenCalledWith("book_consultation", {
        currency: "IDR",
        value: 500000,
      });
    });
  });
});
