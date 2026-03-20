"use client";

import { useStore } from "@nanostores/react";
import {
  $cartItems,
  addToCart as storeAddToCart,
  removeFromCart as storeRemoveFromCart,
  updateQuantity as storeUpdateQuantity,
  clearCart as storeClearCart,
  getCartTotal,
  getCartCount,
  getTotalWeight,
} from "@/lib/stores/cart";

export function useCart() {
  const cartItems = useStore($cartItems);

  return {
    cartItems,
    cartCount: getCartCount(cartItems),
    cartTotal: getCartTotal(cartItems),
    totalWeight: getTotalWeight(cartItems),
    addToCart: storeAddToCart,
    removeFromCart: storeRemoveFromCart,
    updateQuantity: storeUpdateQuantity,
    clearCart: storeClearCart,
  };
}
