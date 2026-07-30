"use client";

import { sendGAEvent } from "@next/third-parties/google";
import type { CartItem } from "@/lib/stores/cart";

export type GA4Item = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
};

export type PurchaseItem = {
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
};

export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (params) {
    sendGAEvent(eventName, params);
  } else {
    sendGAEvent(eventName);
  }
}

export function cartItemToGA4(item: CartItem): GA4Item {
  return {
    item_id: item.variantId,
    item_name: item.productName,
    price: item.unitPrice,
    quantity: item.quantity,
  };
}

export function trackViewItem(item: { itemId: string; itemName: string; price: number }): void {
  trackEvent("view_item", {
    currency: "IDR",
    value: item.price,
    items: [{ item_id: item.itemId, item_name: item.itemName, price: item.price, quantity: 1 }],
  });
}

export function trackAddToCart(item: CartItem): void {
  trackEvent("add_to_cart", {
    currency: "IDR",
    value: item.unitPrice * item.quantity,
    items: [cartItemToGA4(item)],
  });
}

export function trackBeginCheckout(items: CartItem[]): void {
  const value = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  trackEvent("begin_checkout", {
    currency: "IDR",
    value,
    items: items.map(cartItemToGA4),
  });
}

export function trackPurchase(params: {
  transactionId: string;
  value: number;
  shipping: number;
  items: PurchaseItem[];
}): void {
  trackEvent("purchase", {
    transaction_id: params.transactionId,
    currency: "IDR",
    value: params.value,
    shipping: params.shipping,
    items: params.items.map((i) => ({
      item_id: i.itemId,
      item_name: i.itemName,
      price: i.price,
      quantity: i.quantity,
    })),
  });
}

export function trackBookConsultation(params: { value: number }): void {
  trackEvent("book_consultation", {
    currency: "IDR",
    value: params.value,
  });
}
