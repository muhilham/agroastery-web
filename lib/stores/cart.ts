import { atom, onMount } from "nanostores";

export type CartItem = {
  variantId: string;
  productSlug: string;
  productName: string;
  variantDescription: string;
  unitPrice: number;
  quantity: number;
  shipWeightGrams: number;
  image: string;
};

export const $cartItems = atom<CartItem[]>([]);
export const $cartHydrated = atom<boolean>(false);

// Load from localStorage on mount and subscribe to save changes
onMount($cartItems, () => {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem("agroastery_cart");
    if (stored) {
      $cartItems.set(JSON.parse(stored));
    }
  } catch {
    // ignore parse errors
  }

  $cartHydrated.set(true);

  // Skip the initial subscribe callback (which fires immediately with current value)
  let initialized = false;
  const unsub = $cartItems.subscribe((items) => {
    if (!initialized) {
      initialized = true;
      return;
    }
    try {
      localStorage.setItem("agroastery_cart", JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  });

  return unsub;
});

export function addToCart(item: CartItem) {
  const current = $cartItems.get();
  const existing = current.find((i) => i.variantId === item.variantId);

  if (existing) {
    $cartItems.set(
      current.map((i) =>
        i.variantId === item.variantId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      )
    );
  } else {
    $cartItems.set([...current, item]);
  }
}

export function removeFromCart(variantId: string) {
  $cartItems.set($cartItems.get().filter((i) => i.variantId !== variantId));
}

export function updateQuantity(variantId: string, qty: number) {
  if (qty <= 0) {
    removeFromCart(variantId);
    return;
  }
  const maxQty = Math.min(qty, 100);
  $cartItems.set(
    $cartItems.get().map((i) =>
      i.variantId === variantId ? { ...i, quantity: maxQty } : i
    )
  );
}

export function clearCart() {
  $cartItems.set([]);
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

export function getCartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function getTotalWeight(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.shipWeightGrams * i.quantity, 0);
}
