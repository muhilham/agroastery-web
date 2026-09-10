import { describe, it, expect } from "vitest";
import { buildMetaProductTags, resolveInitialSelection, resolveShownVariant } from "./metaProduct";

const product = {
  id: "p1",
  product_options: [
    { id: "o-size", display_order: 0, product_option_values: [{ id: "v-250", display_order: 0 }, { id: "v-500", display_order: 1 }] },
    { id: "o-grind", display_order: 1, product_option_values: [{ id: "v-whole", display_order: 0 }, { id: "v-espresso", display_order: 1 }] },
  ],
  product_variants: [
    { id: "var1", is_active: true, sku: "AGRO-BLEND-250", product_variant_option_values: [{ option_value_id: "v-250" }, { option_value_id: "v-whole" }] },
    { id: "var2", is_active: true, sku: null, product_variant_option_values: [{ option_value_id: "v-500" }, { option_value_id: "v-espresso" }] },
    { id: "var3", is_active: false, sku: null, product_variant_option_values: [{ option_value_id: "v-250" }, { option_value_id: "v-espresso" }] },
  ],
};

// UI display order differs from array order: 500gr shown first =>
// default selection is {500, whole}, a combo with no variant
const productWithOrder = {
  ...product,
  product_options: [
    { ...product.product_options[0], product_option_values: [
      { id: "v-500", display_order: 0 },
      { id: "v-250", display_order: 1 },
    ] },
    product.product_options[1],
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

describe("resolveShownVariant", () => {
  it("prefers the ?variant= deep link", () => {
    expect(resolveShownVariant(product as never, "var2")?.id).toBe("var2");
  });

  it("with no deep link, tags the variant the form defaults to (first value per option by display_order) — not array[0]", () => {
    // UI order: 500gr first, whole-bean first => default combo {500,whole}
    // has no variant => null (shopper sees no selectable variant either)
    expect(resolveShownVariant(productWithOrder as never, null)).toBeNull();
  });

  it("default selection finds the exact variant when it exists", () => {
    const ordered = {
      ...productWithOrder,
      product_options: [
        { id: "o-size", display_order: 0, product_option_values: [
          { id: "v-250", display_order: 0 },
          { id: "v-500", display_order: 1 },
        ] },
        { id: "o-grind", display_order: 1, product_option_values: [
          { id: "v-whole", display_order: 0 },
          { id: "v-espresso", display_order: 1 },
        ] },
      ],
    };
    expect(resolveShownVariant(ordered as never, null)?.id).toBe("var1");
  });

  it("ignores inactive deep links (falls back to default selection)", () => {
    expect(resolveShownVariant(product as never, "var3")?.id).toBe("var1"); // var3 inactive -> default var1
  });

  it("option-less product returns first active variant", () => {
    const bare = { product_options: [], product_variants: [{ id: "x", is_active: true, sku: "S", product_variant_option_values: [] }] };
    expect(resolveShownVariant(bare as never, null)?.id).toBe("x");
  });

  it("all-inactive product returns null (tags say out of stock)", () => {
    const oos = { product_options: [], product_variants: [{ id: "x", is_active: false, sku: "S", product_variant_option_values: [] }] };
    expect(resolveShownVariant(oos as never, null)).toBeNull();
  });
});
