/**
 * Instagram/Meta shopping signals on the product detail page.
 *
 * MetaExternalAgent (the crawler behind IG product tags + catalog sync)
 * reads the Open Graph `product:` namespace and og:type=product from the
 * page HTML. Next 16's metadata API has no product type, so page.tsx emits
 * them as raw <meta> (React 19 hoists them into <head> when the page
 * renders). This test renders the real page component to prove the tags
 * reach the DOM — not just the pure builder.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

const mockProduct = {
  id: "prod-5050",
  slug: "biji-kopi-blend-5050-kopi-susu-ekonomis",
  name: "Biji Kopi Blend 50/50 Kopi Susu Ekonomis",
  description: "<p>50% Arabica, 50% Robusta</p>",
  short_description: "Blend kopi susu",
  is_active: true,
  created_at: "2026-01-01",
  product_images: [{ id: "i1", url: "https://cdn.agroastery.com/products/e5596819/1777543186539.jpg" }],
  product_categories: [{ id: "c1", name: "Biji Kopi", slug: "biji-kopi" }],
  product_options: [
    { id: "o1", name: "Ukuran", display_order: 0, product_option_values: [
      { id: "v1", name: "250gr", display_order: 0, product_variant_option_values: [] },
      { id: "v2", name: "500gr", display_order: 1, product_variant_option_values: [] },
    ] },
  ],
  product_variants: [
    { id: "var-250", sku: "AGRO-5050-250", name: "250gr", price: 29370, discounted_price: null, compare_at_price: null, stock_quantity: 12, is_active: true, images: [], weight_grams: 250, display_order: 0, product_variant_option_values: [{ option_value_id: "v1" }] },
    { id: "var-500", sku: null, name: "500gr", price: 54000, discounted_price: null, compare_at_price: null, stock_quantity: 0, is_active: true, images: [], weight_grams: 500, display_order: 1, product_variant_option_values: [{ option_value_id: "v2" }] },
  ],
  product_faqs: [],
};

vi.mock("@/lib/supabase/queries/products", () => ({
  getProductBySlug: vi.fn(async () => mockProduct),
}));
// client-only bits the detail component pulls in
vi.mock("@/lib/hooks/useCart", () => ({ useCart: () => ({ addToCart: vi.fn() }) }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => `/${mockProduct.slug}`,
}));

import { getProductBySlug } from "@/lib/supabase/queries/products";
import ProductPage from "@/app/(root)/product/[slug]/page";

async function renderPage(
  searchParams: Record<string, string | undefined> = {},
  // fresh key per product shape: getCachedProductBySlug = cache() memoizes by slug
  slug: string = mockProduct.slug
) {
  const el = await ProductPage({
    params: Promise.resolve({ slug }),
    searchParams: Promise.resolve(searchParams),
  } as never);
  return renderToStaticMarkup(el as React.ReactElement);
}

describe("product page — Instagram/Meta shopping signals", () => {
  beforeEach(() => {
    vi.mocked(getProductBySlug).mockResolvedValue(mockProduct as never);
  });

  it("emits og:type=product + product: namespace tags in the rendered HTML", async () => {
    const html = await renderPage();
    expect(html).toContain('<meta property="og:type" content="product"');
    expect(html).toContain('<meta property="product:retailer_item_id" content="AGRO-5050-250"');
    expect(html).toContain('<meta property="product:item_group_id" content="prod-5050"');
    expect(html).toContain('<meta property="product:price:amount" content="29370"');
    expect(html).toContain('<meta property="product:price:currency" content="IDR"');
    expect(html).toContain('<meta property="product:availability" content="in stock"');
  });

  it("?variant=<id> tags the linked variant (what the shopper lands on)", async () => {
    const html = await renderPage({ variant: "var-500" });
    expect(html).toContain('<meta property="product:retailer_item_id" content="prod-5050"'); // no SKU => product id
    expect(html).toContain('<meta property="product:price:amount" content="54000"');
    expect(html).toContain('<meta property="product:availability" content="out of stock"');
  });

  it("default landing tags the form's shown variant, not array[0]: 500gr first in UI order => 54000/out of stock", async () => {
    // Flip display_order so the form defaults to 500gr (stock 0). A naive
    // array[0] tag would report 29370/in stock — wrong price to Meta.
    const reordered = structuredClone(mockProduct);
    // swap display_order (the code sorts by it, not array order)
    reordered.product_options[0].product_option_values[0].display_order = 1;
    reordered.product_options[0].product_option_values[1].display_order = 0;
    vi.mocked(getProductBySlug).mockResolvedValue(reordered as never);
    const html = await renderPage({}, "reordered-slug");
    expect(html).toContain('<meta property="product:price:amount" content="54000"');
    expect(html).toContain('<meta property="product:availability" content="out of stock"');
  });

  it("JSON-LD carries sku/mpn for catalog matching", async () => {
    const html = await renderPage();
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ?? [];
    const product = m.map((s) => JSON.parse(s.replace(/<\/?script[^>]*>/g, ""))).find((j) => j["@type"] === "Product");
    expect(product).toBeTruthy();
    expect(product.sku).toBeDefined();
    expect(product.mpn).toBe("AGRO-5050-250");
    expect(product.offers.lowPrice).toBe(29370);
  });
});
