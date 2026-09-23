/**
 * Issue #178 coverage for /harga-biji-kopi-arabica — live price table + FAQ.
 *
 * The table rows are DERIVED from the mocked catalog (Gayo: 100g 59.000 →
 * 1kg 388.000), which proves the real pipeline end-to-end without a DB.
 */
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FIXTURE_PRODUCTS } from "@/lib/seo/testing/fixtures";

vi.mock("@/lib/supabase/queries/products", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/supabase/queries/products")>();
  return { ...actual, getProducts: vi.fn(async () => FIXTURE_PRODUCTS) };
});

vi.mock("@/components/navigation", () => ({ default: () => null }));
vi.mock("@/components/ui/footer", () => ({ Footer: () => null }));

import { getProducts } from "@/lib/supabase/queries/products";
import * as hargaArabicaPage from "@/app/(root)/harga-biji-kopi-arabica/page";
import * as rootLayout from "@/app/layout";
import { expectSeo, renderMetaTags } from "@/lib/testing/seo";

async function renderBody(): Promise<string> {
  const el = await hargaArabicaPage.default();
  return renderToStaticMarkup(el as React.ReactElement);
}

function jsonLdBlocks(html: string): any[] {
  const m =
    html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ??
    [];
  return m.map((s) => JSON.parse(s.replace(/<\/?script[^>]*>/g, "")));
}

describe("/harga-biji-kopi-arabica metadata — object level", () => {
  it("keyword title, CTA description, self-canonical, indexable", () => {
    expectSeo(hargaArabicaPage, {
      title: "Harga Biji Kopi Arabica per Kg — Agroastery",
      description: /harga biji kopi arabica per kilogram/i,
      canonical: "/harga-biji-kopi-arabica",
      noindex: false,
    });
  });
});

describe("/harga-biji-kopi-arabica — rendered tags", () => {
  it("emits absolute canonical and no noindex", async () => {
    const { document } = await renderMetaTags(rootLayout, hargaArabicaPage, {
      segments: ["harga-biji-kopi-arabica"],
      pathname: "/harga-biji-kopi-arabica",
    });
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href")
    ).toBe("https://agroastery.com/harga-biji-kopi-arabica");
    expect(
      document.querySelector('meta[name="robots"][content*="noindex"]')
    ).toBeNull();
  });
});

describe("/harga-biji-kopi-arabica — page body", () => {
  it("has exactly one H1 with the price keyword", async () => {
    const html = await renderBody();
    const h1s = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/g) ?? [];
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toContain("Harga Biji Kopi Arabica per Kg");
  });

  it("renders a real price table derived from the catalog fixture", async () => {
    const html = await renderBody();
    // Gayo arabica from FIXTURE_PRODUCTS — per-pack and derived per-kg.
    expect(html).toContain("Biji Kopi Standard Gayo Full Arabica");
    expect(html).toContain("/product/biji-kopi-standard-gayo-full-arabica");
    expect(html).toContain("Rp\u00A059.000"); // 100 g pack
    expect(html).toContain("Rp\u00A0388.000"); // 1 kg pack = best/kg
    // Non-parseable size (ml) must not leak into the kg table.
    expect(html).not.toContain("Espresso Arabica Kintamani 1000ml");
  });

  it("renders the FAQ section and FAQPage JSON-LD with identical answers", async () => {
    const html = await renderBody();
    expect(html).toContain("Berapa harga biji kopi arabica per kg?");
    const blocks = jsonLdBlocks(html);
    const crumb = blocks.find((b) => b["@type"] === "BreadcrumbList");
    expect(crumb?.itemListElement?.[2]).toMatchObject({
      name: "Harga Biji Kopi Arabica",
      item: "https://agroastery.com/harga-biji-kopi-arabica",
    });
    const faq = blocks.find((b) => b["@type"] === "FAQPage");
    expect(faq.mainEntity.length).toBeGreaterThanOrEqual(4);
    expect(faq.mainEntity[0].acceptedAnswer.text).toContain("Rp\u00A0388.000");
    expect(html).toContain(faq.mainEntity[1].name);
  });

  it("links to /konsultasi, the supplier page, and category pages", async () => {
    const html = await renderBody();
    expect(html).toContain('href="/konsultasi"');
    expect(html).toContain('href="/supplier-biji-kopi-cafe"');
    expect(html).toContain('href="/kopi-susu-ekonomis"');
    expect(html).toContain('href="/roasted-for-filter"');
  });

  it("falls back to the labelled snapshot when the catalog query fails", async () => {
    vi.mocked(getProducts).mockRejectedValueOnce(new Error("db down"));
    const html = await renderBody();
    expect(html).toContain("Biji Kopi Full Arabica Kopi Susu Ekonomis 1 Kg");
    expect(html).toContain("snapshot harga katalog terakhir");
    // Fallback prices are the verified 2026-09 catalog, not invented numbers.
    expect(html).toContain("Rp\u00A0237.000");
  });
});
