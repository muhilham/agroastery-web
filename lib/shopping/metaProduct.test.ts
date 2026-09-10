import { describe, it, expect } from "vitest";
import { buildMetaProductTags, resolveInitialSelection } from "./metaProduct";

const product = {
  id: "p1",
  product_options: [
    { id: "o-size", product_option_values: [{ id: "v-250" }, { id: "v-500" }] },
    { id: "o-grind", product_option_values: [{ id: "v-whole" }, { id: "v-espresso" }] },
  ],
  product_variants: [
    { id: "var1", is_active: true, sku: "AGRO-BLEND-250", product_variant_option_values: [{ option_value_id: "v-250" }, { option_value_id: "v-whole" }] },
    { id: "var2", is_active: true, sku: null, product_variant_option_values: [{ option_value_id: "v-500" }, { option_value_id: "v-espresso" }] },
    { id: "var3", is_active: false, sku: null, product_variant_option_values: [{ option_value_id: "v-250" }, { option_value_id: "v-espresso" }] },
  ],
};

describe("buildMetaProductTags", () => {
  it("emits the full OG product namespace Meta scrapes", () => {
    const tags = buildMetaProductTags({ productId: "p1", sku: "AGRO-BLEND-250", price: 29370, inStock: true });
    const map = Object.fromEntries(tags.map((t) => [t.property, t.content]));
    expect(map).toMatchObject({
      "og:type": "product",
      "product:retailer_item_id": "AGRO-BLEND-250",
      "product:item_group_id": "p1",
      "product:price:amount": "29370",
      "product:price:currency": "IDR",
      "product:availability": "in stock",
      "product:condition": "new",
      "product:brand": "Agroastery",
    });
  });

  it("falls back to the product id when the variant has no SKU, and flags stock", () => {
    const map = Object.fromEntries(
      buildMetaProductTags({ productId: "p1", sku: null, price: 55000, inStock: false }).map((t) => [t.property, t.content])
    );
    expect(map["product:retailer_item_id"]).toBe("p1");
    expect(map["product:availability"]).toBe("out of stock");
  });
});

describe("resolveInitialSelection", () => {
  it("maps an active variant id to its per-option value selection", () => {
    expect(resolveInitialSelection(product, "var2")).toEqual({
      "o-size": "v-500",
      "o-grind": "v-espresso",
    });
  });

  it("returns null for missing, inactive, or unknown variant ids", () => {
    expect(resolveInitialSelection(product, undefined)).toBeNull();
    expect(resolveInitialSelection(product, null)).toBeNull();
    expect(resolveInitialSelection(product, "nope")).toBeNull();
    expect(resolveInitialSelection(product, "var3")).toBeNull(); // inactive
  });

  it("returns null (falls back to defaults) for a variant-less product", () => {
    const bare = { product_options: [], product_variants: [{ id: "x", is_active: true, sku: null, product_variant_option_values: [] }] };
    expect(resolveInitialSelection(bare, "x")).toBeNull();
  });
});
