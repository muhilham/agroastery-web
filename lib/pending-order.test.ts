import { describe, it, expect, beforeEach } from "vitest";
import {
  savePendingOrder,
  loadPendingOrder,
  clearPendingOrder,
  PENDING_ORDER_STORAGE_KEY,
  PENDING_ORDER_VERSION_KEY,
} from "./pending-order";

const pointer = {
  orderId: "11111111-1111-1111-1111-111111111111",
  orderNumber: "AGR-20260903-AAAA",
  total: 185000,
  savedAt: new Date().toISOString(),
};

describe("pending-order pointer storage (#226 P1a)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a valid pointer", () => {
    savePendingOrder(pointer);
    expect(loadPendingOrder()).toEqual(pointer);
  });

  it("rejects malformed JSON instead of throwing", () => {
    localStorage.setItem(PENDING_ORDER_STORAGE_KEY, "{not json");
    expect(loadPendingOrder()).toBeNull();
  });

  it("rejects objects with the wrong shape", () => {
    localStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify({ orderId: 42 }));
    expect(loadPendingOrder()).toBeNull();
  });

  it("rejects a non-UUID orderId (tampered payload must never reach a fetch URL)", () => {
    localStorage.setItem(
      PENDING_ORDER_STORAGE_KEY,
      JSON.stringify({ ...pointer, orderId: "../../other-api-route" })
    );
    localStorage.setItem(PENDING_ORDER_VERSION_KEY, "1");
    expect(loadPendingOrder()).toBeNull();
    // invalid payload is dropped, not trusted
    expect(localStorage.getItem(PENDING_ORDER_STORAGE_KEY)).toBeNull();
  });

  it("clears silently when nothing is stored", () => {
    clearPendingOrder();
    expect(loadPendingOrder()).toBeNull();
  });

  // The cart-store trap called out in the issue: a future shape change must
  // strand old payloads, and an old payload from a future version must never
  // be read as the current shape.
  it("returns null when the stored version does not match the schema version", () => {
    savePendingOrder(pointer);
    localStorage.setItem(PENDING_ORDER_VERSION_KEY, "999");
    expect(loadPendingOrder()).toBeNull();
  });

  it("drops a stale-version payload when saving the new shape", () => {
    localStorage.setItem(PENDING_ORDER_VERSION_KEY, "0");
    localStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(pointer));
    savePendingOrder(pointer);
    expect(localStorage.getItem(PENDING_ORDER_VERSION_KEY)).toBe("1");
    expect(loadPendingOrder()).toEqual(pointer);
  });
});
