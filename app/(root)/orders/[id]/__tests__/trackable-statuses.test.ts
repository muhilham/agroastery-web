import { describe, it, expect } from "vitest";
import { TRACKABLE_STATUSES } from "../trackable-statuses";

describe("TRACKABLE_STATUSES", () => {
  it("includes all active order statuses", () => {
    expect(TRACKABLE_STATUSES).toContain("pending_payment");
    expect(TRACKABLE_STATUSES).toContain("paid");
    expect(TRACKABLE_STATUSES).toContain("processing");
    expect(TRACKABLE_STATUSES).toContain("shipped");
    expect(TRACKABLE_STATUSES).toContain("delivered");
  });

  it("excludes terminal statuses", () => {
    expect(TRACKABLE_STATUSES).not.toContain("cancelled");
    expect(TRACKABLE_STATUSES).not.toContain("refunded");
  });
});
