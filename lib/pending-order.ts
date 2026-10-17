// Issue #226 P1a: same-browser pointer to the last abandoned unpaid order.
// Versioned-storage pattern mirrors lib/stores/cart.ts: a schema-version key
// forces a clean reset when the shape changes, and any malformed payload is
// cleared rather than trusted.
const PENDING_ORDER_SCHEMA_VERSION = 1;
// Exported for tests: asserting against the REAL key names is the only way a
// typo'd import can't silently target localStorage under "undefined".
export const PENDING_ORDER_STORAGE_KEY = "agroastery_pending_order";
export const PENDING_ORDER_VERSION_KEY = "agroastery_pending_order_version";

export type PendingOrder = {
  orderId: string;
  orderNumber: string;
  total: number;
  savedAt: string; // ISO 8601
};

function isValidPendingOrder(data: unknown): data is PendingOrder {
  if (typeof data !== "object" || data === null) return false;
  const p = data as Record<string, unknown>;
  return (
    // UUID shape enforced: the banner interpolates orderId into a fetch URL,
    // so a tampered "../../x" payload must never survive the load-time check.
    typeof p.orderId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.orderId) &&
    typeof p.orderNumber === "string" &&
    p.orderNumber.length > 0 &&
    p.orderNumber.length <= 64 &&
    typeof p.total === "number" &&
    Number.isFinite(p.total) &&
    typeof p.savedAt === "string" &&
    !Number.isNaN(Date.parse(p.savedAt))
  );
}

export function savePendingOrder(order: PendingOrder): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(order));
    localStorage.setItem(PENDING_ORDER_VERSION_KEY, String(PENDING_ORDER_SCHEMA_VERSION));
  } catch {
    // storage full/blocked — pointer is best-effort, never break checkout
  }
}

export function loadPendingOrder(): PendingOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const storedVersion = localStorage.getItem(PENDING_ORDER_VERSION_KEY);
    if (storedVersion !== String(PENDING_ORDER_SCHEMA_VERSION)) {
      // Version drift (or first visit): drop any stale shape.
      localStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
      return null;
    }
    const stored = localStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!isValidPendingOrder(parsed)) {
      clearPendingOrder();
      return null;
    }
    return parsed;
  } catch {
    clearPendingOrder();
    return null;
  }
}

export function clearPendingOrder(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
  } catch {
    // ignore
  }
}
