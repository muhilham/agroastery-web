import { describe, it, expect, afterEach, vi } from "vitest";
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
    delete (window as { gtag?: unknown }).gtag;
  });

  describe("trackEvent", () => {
    it("does not throw when window.gtag is absent", () => {
      delete (window as { gtag?: unknown }).gtag;
      expect(() => trackEvent("test_event", { foo: "bar" })).not.toThrow();
    });

    it("calls window.gtag with event name and params when present", () => {
      const gtag = vi.fn();
      window.gtag = gtag;
      trackEvent("test_event", { foo: "bar" });
      expect(gtag).toHaveBeenCalledWith("event", "test_event", { foo: "bar" });
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
      const gtag = vi.fn();
      window.gtag = gtag;
      trackViewItem({ itemId: "variant-1", itemName: "Kopi Arabika", price: 50000 });
      expect(gtag).toHaveBeenCalledWith("event", "view_item", {
        currency: "IDR",
        value: 50000,
        items: [{ item_id: "variant-1", item_name: "Kopi Arabika", price: 50000, quantity: 1 }],
      });
    });
  });

  describe("trackAddToCart", () => {
    it("fires add_to_cart with value = unitPrice * quantity", () => {
      const gtag = vi.fn();
      window.gtag = gtag;
      trackAddToCart(sampleItem);
      expect(gtag).toHaveBeenCalledWith("event", "add_to_cart", {
        currency: "IDR",
        value: 100000,
        items: [{ item_id: "variant-1", item_name: "Kopi Arabika", price: 50000, quantity: 2 }],
      });
    });
  });

  describe("trackBeginCheckout", () => {
    it("fires begin_checkout with summed value across items", () => {
      const gtag = vi.fn();
      window.gtag = gtag;
      const items: CartItem[] = [
        sampleItem,
        { ...sampleItem, variantId: "variant-2", productName: "Kopi Robusta", unitPrice: 30000, quantity: 1 },
      ];
      trackBeginCheckout(items);
      expect(gtag).toHaveBeenCalledWith("event", "begin_checkout", {
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
      const gtag = vi.fn();
      window.gtag = gtag;
      trackPurchase({
        transactionId: "AGR-20260730-0001",
        value: 115000,
        shipping: 15000,
        items: [{ itemId: "variant-1", itemName: "Kopi Arabika", price: 50000, quantity: 2 }],
      });
      expect(gtag).toHaveBeenCalledWith("event", "purchase", {
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
      const gtag = vi.fn();
      window.gtag = gtag;
      trackBookConsultation({ value: 500000 });
      expect(gtag).toHaveBeenCalledWith("event", "book_consultation", {
        currency: "IDR",
        value: 500000,
      });
    });
  });
});
