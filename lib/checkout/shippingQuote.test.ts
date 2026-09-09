import { describe, it, expect } from "vitest";
import { buildQuoteItems, QUOTE_ITEM_DIMS } from "./shippingQuote";

describe("buildQuoteItems (issue #138)", () => {
  it("totalizes weight per line and collapses quantity to 1", () => {
    // Cart: 1x 250g + 2x 500g -> per-line totals 250 and 1000, both qty 1.
    const items = buildQuoteItems([
      { name: "Kopi A", unitPrice: 85000, weightGramsPerUnit: 250, quantity: 1 },
      { name: "Kopi B", unitPrice: 150000, weightGramsPerUnit: 500, quantity: 2 },
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ weight: 250, quantity: 1, value: 85000 });
    expect(items[1]).toMatchObject({ weight: 1000, quantity: 1, value: 300000 });
  });

  it("multi-qty cart quotes the same parcel weight as a single merged line", () => {
    // The old bug sent weight=1250 (total) with quantity=3 -> Biteship billed
    // 3750g. Totalized lines sum to exactly 1250g.
    const items = buildQuoteItems([
      { name: "Kopi A", unitPrice: 85000, weightGramsPerUnit: 250, quantity: 1 },
      { name: "Kopi B", unitPrice: 150000, weightGramsPerUnit: 500, quantity: 2 },
    ]);
    const totalBillable = items.reduce((s, i) => s + i.weight * i.quantity, 0);
    expect(totalBillable).toBe(1250);
  });

  it("enforces a 100g minimum per line", () => {
    const items = buildQuoteItems([
      { name: "Sachet", unitPrice: 15000, weightGramsPerUnit: 10, quantity: 2 },
    ]);
    expect(items[0].weight).toBe(100);
  });

  it("uses draft-order dimensions (20x15x10) so quote volumetric matches shipment", () => {
    const items = buildQuoteItems([
      { name: "Kopi", unitPrice: 1, weightGramsPerUnit: 250, quantity: 1 },
    ]);
    expect(items[0]).toMatchObject({ length: 20, width: 15, height: 10 });
    expect(QUOTE_ITEM_DIMS).toEqual({ length: 20, width: 15, height: 10 });
  });
});
