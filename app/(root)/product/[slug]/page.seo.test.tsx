/**
 * Issue #235 — 5050 PDP intent-copy SEO regression tests.
 *
 * Fixture mirrors the LIVE product shape verified via Supabase REST + curl on
 * agroastery.com (Oct 2026): options Size(100gram..1Kg) x Varian(Whole
 * Beans/Grind ...), kg pack Rp218.000, 100g pack Rp33.000. The pre-fix page
 * bled the min-variant price ("... — Rp 29.370") into every meta description
 * and kept FAQs in JSON-LD only (no visible parity). These assert:
 *   1. meta description <=160 chars, kg anchor, no stray min-variant fragment
 *   2. FAQPage mainEntity contains >=2 intent questions
 *   3. visible DOM FAQ === JSON-LD questions exactly (Google parity rule)
 *   4. PDP body links /start/blend-50-50 (previously QR-only reachability)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

const mockProduct = {
  id: "prod-5050-live",
  slug: "biji-kopi-blend-5050-kopi-susu-ekonomis",
  name: "Biji Kopi Blend 50/50 Kopi Susu Ekonomis",
  description:
    "<p>Di rekomendasikan untuk menu es kopi susu aren (atau pemanis lainnya) dengan 50% Arabica dan 50% Robusta dengan rasa yang pas dan budget ekonomis.</p>",
  short_description: null,
  is_active: true,
  created_at: "2026-01-01",
  product_images: [{ id: "i1", url: "https://cdn.agroastery.com/produk/kopi-susu-50-50/1.png" }],
  product_categories: [{ id: "c1", name: "Biji Kopi", slug: "biji-kopi" }],
  product_options: [
    {
      id: "o-size",
      name: "Size",
      display_order: 0,
      product_option_values: [
        { id: "s100", value: "100gram", display_order: 0 },
        { id: "s1kg", value: "1Kg", display_order: 3 },
      ],
    },
    {
      id: "o-var",
      name: "Varian",
      display_order: 1,
      product_option_values: [
        { id: "v-beans", value: "Whole Beans", display_order: 0 },
        { id: "v-fine", value: "Grind Fine", display_order: 1 },
        { id: "v-med", value: "Grind Medium", display_order: 2 },
      ],
    },
  ],
  product_variants: [
    { id: "v100-beans", sku: "PJ-100-B", name: "100gram/Whole Beans", price: 33000, discounted_price: undefined, compare_at_price: null, stock_quantity: 997, is_active: true, images: [], weight_grams: 100, ship_weight_grams: 120, display_order: 0, product_variant_option_values: [{ option_value_id: "s100" }, { option_value_id: "v-beans" }] },
    { id: "v1kg-beans", sku: "PJ-1KG-B", name: "1Kg/Whole Beans", price: 218000, discounted_price: undefined, compare_at_price: null, stock_quantity: 918, is_active: true, images: [], weight_grams: 1000, ship_weight_grams: 1050, display_order: 1, product_variant_option_values: [{ option_value_id: "s1kg" }, { option_value_id: "v-beans" }] },
    { id: "v1kg-med", sku: "PJ-1KG-M", name: "1Kg/Grind Medium", price: 219000, discounted_price: undefined, compare_at_price: null, stock_quantity: 999, is_active: true, images: [], weight_grams: 1000, ship_weight_grams: 1050, display_order: 2, product_variant_option_values: [{ option_value_id: "s1kg" }, { option_value_id: "v-med" }] },
  ],
  product_faqs: [],
};

vi.mock("@/lib/supabase/queries/products", () => ({
  getProductBySlug: vi.fn(async () => mockProduct),
  getAggregateSoldCount: vi.fn(async () => null),
}));
vi.mock("@/lib/hooks/useCart", () => ({ useCart: () => ({ addToCart: vi.fn() }) }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/product/x",
}));

import { getProductBySlug } from "@/lib/supabase/queries/products";
import ProductPage, { generateMetadata } from "@/app/(root)/product/[slug]/page";

async function renderPage(slug: string = mockProduct.slug): Promise<string> {
  const el = await ProductPage({
    params: Promise.resolve({ slug }),
    searchParams: Promise.resolve({}),
  } as never);
  return renderToStaticMarkup(el as React.ReactElement);
}

function ldBlocks(html: string): any[] {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ?? [];
  return m.map((s) => JSON.parse(s.replace(/<\/?script[^>]*>/g, "")));
}

describe("5050 PDP — meta description price anchor (issue #235)", () => {
  beforeEach(() => {
    vi.mocked(getProductBySlug).mockResolvedValue(mockProduct as never);
  });

  it("leads with the use-case copy, anchors on the kg pack rate, <=160 chars", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "d-desc" }) } as never);
    const desc = String(meta?.description ?? "");
    expect(desc.length).toBeLessThanOrEqual(160);
    expect(desc).toContain("es kopi susu");
    expect(desc).toContain("218.000"); // Rp218.000/kg — the real purchasable kg pack
    expect(desc).toContain("/kg");
    // the pre-fix bleed: min-variant 100g price appended as " — Rp 29.370"-style fragment
    expect(desc).not.toMatch(/— Rp\s?33\.000$/);
    expect(desc).not.toMatch(/— Rp\s?33\.000\b/);
  });

  it("falls back to largest-pack copy without inventing a /kg rate", async () => {
    const noKg = structuredClone(mockProduct);
    noKg.product_variants = noKg.product_variants.filter((v: any) => v.price < 200000);
    vi.mocked(getProductBySlug).mockResolvedValue(noKg as never);
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "d-pack" }) } as never);
    const desc = String(meta?.description ?? "");
    expect(desc).toContain("33.000");
    expect(desc).not.toContain("/kg");
  });
});

describe("5050 PDP — FAQ intent copy + visible/JSON-LD parity", () => {
  beforeEach(() => {
    vi.mocked(getProductBySlug).mockResolvedValue(mockProduct as never);
  });

  it("FAQPage mainEntity carries the intent questions", async () => {
    const html = await renderPage("faq-jsonld");
    const faq = ldBlocks(html).find((j) => j["@type"] === "FAQPage");
    const questions: string[] = faq.mainEntity.map((q: any) => q.name);
    expect(questions).toContain("Kopi apa yang cocok untuk es kopi susu ekonomis?");
    expect(questions).toContain("Arabica atau robusta untuk menu susu?");
    expect(questions).toContain(
      "Berapa harga biji kopi Blend 50/50 Kopi Susu Ekonomis per kilo?"
    );
    expect(questions.length).toBeGreaterThanOrEqual(4);
  });

  it("visible DOM FAQ questions match the JSON-LD exactly (parity rule)", async () => {
    const html = await renderPage("faq-parity");
    const faq = ldBlocks(html).find((j) => j["@type"] === "FAQPage");
    const ldQuestions: string[] = faq.mainEntity.map((q: any) => q.name);
    const dom = new JSDOMWrapper(html);
    const visibleQuestions = dom.getDtTexts();
    expect(visibleQuestions.length).toBeGreaterThan(0);
    expect(visibleQuestions).toEqual(ldQuestions);
  });

  it("answers the price question with the kg pack rate, not the 100g price", async () => {
    const html = await renderPage("faq-price");
    const faq = ldBlocks(html).find((j) => j["@type"] === "FAQPage");
    const priceFaq = faq.mainEntity.find((q: any) => /per kilo/.test(q.name));
    expect(priceFaq.acceptedAnswer.text).toContain("218.000");
    expect(priceFaq.acceptedAnswer.text).not.toContain("33.000");
  });
});

describe("5050 PDP — brew guide link", () => {
  beforeEach(() => {
    vi.mocked(getProductBySlug).mockResolvedValue(mockProduct as never);
  });

  it("body links /start/blend-50-50 (the conversion asset was QR-only)", async () => {
    const html = await renderPage("guide-link");
    expect(html).toContain('href="/start/blend-50-50"');
    expect(html).toContain("Resep resmi");
  });

  it("other products do NOT get the 5050 guide link", async () => {
    const other = structuredClone(mockProduct);
    other.slug = "arabica-gayo-wine";
    other.name = "Arabica Gayo Wine";
    vi.mocked(getProductBySlug).mockResolvedValue(other as never);
    const html = await renderPage("arabica-gayo-wine");
    expect(html).not.toContain('href="/start/blend-50-50"');
  });
});

/** Minimal dt collector: the PDP FAQ renders <dl><dt>question</dt>...</dl>. */
class JSDOMWrapper {
  private dts: string[];
  constructor(html: string) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    this.dts = [...doc.querySelectorAll("dl dt")].map((el) => el.textContent ?? "");
  }
  getDtTexts(): string[] {
    return this.dts;
  }
}
