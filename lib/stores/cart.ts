import { atom, onMount } from "nanostores";

// CART_SCHEMA_VERSION: Increment when CartItem type changes to force clear old carts
const CART_SCHEMA_VERSION = 2;
const CART_STORAGE_KEY = "agroastery_cart";
const CART_VERSION_KEY = "agroastery_cart_version";

export type CartItem = {
  variantId: string;
  productSlug: string;
  productName: string;
  variantDescription: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  shipWeightGrams: number;
  image: string;
};

export const $cartItems = atom<CartItem[]>([]);
export const $cartHydrated = atom<boolean>(false);

// Check if stored items have the new schema (originalPrice field)
function isValidCartItem(item: unknown): item is CartItem {
  if (typeof item !== "object" || item === null) return false;
  const cartItem = item as Record<string, unknown>;
  return (
    typeof cartItem.variantId === "string" &&
    typeof cartItem.productSlug === "string" &&
    typeof cartItem.productName === "string" &&
    typeof cartItem.unitPrice === "number" &&
    typeof cartItem.originalPrice === "number" &&
    typeof cartItem.quantity === "number"
  );
}

// Load from localStorage on mount and subscribe to save changes
onMount($cartItems, () => {
  if (typeof window === "undefined") return;

  try {
    const storedVersion = localStorage.getItem(CART_VERSION_KEY);
    const needsReset = storedVersion !== String(CART_SCHEMA_VERSION);

    if (needsReset) {
      // Clear old cart data due to schema change
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.setItem(CART_VERSION_KEY, String(CART_SCHEMA_VERSION));
    } else {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown[];
        // Validate all items have required fields
        const validItems = parsed.filter(isValidCartItem);
        if (validItems.length === parsed.length) {
          $cartItems.set(validItems);
        } else {
          // If any items are invalid, clear the cart
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
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
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      localStorage.setItem(CART_VERSION_KEY, String(CART_SCHEMA_VERSION));
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
