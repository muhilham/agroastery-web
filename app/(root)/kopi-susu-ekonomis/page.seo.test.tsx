/**
 * Issue #178 coverage for /kopi-susu-ekonomis.
 *
 * Object level: exported metadata. DOM level: rendered tags through Next's
 * resolver + page body (one H1, category wiring, JSON-LD, internal links)
 * against a mocked catalog fixture.
 */
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FIXTURE_PRODUCTS } from "@/lib/seo/testing/fixtures";

vi.mock("@/lib/supabase/queries/products", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/queries/products")>();
  return { ...actual, getProducts: vi.fn(async () => FIXTURE_PRODUCTS) };
});

// Chrome around the page body — out of scope for these tests.
vi.mock("@/components/navigation", () => ({ default: () => null }));
vi.mock("@/components/ui/footer", () => ({ Footer: () => null }));
// ProductCard is a client component; useRouter has no router outside the app.
vi.mock("next/navigation", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  useRouter: () => ({ push: vi.fn() }),
}));

import * as kopiSusuEkonomisPage from "@/app/(root)/kopi-susu-ekonomis/page";
import * as rootLayout from "@/app/layout";
import { expectSeo, renderMetaTags } from "@/lib/testing/seo";

describe("/kopi-susu-ekonomis metadata — object level", () => {
  it("keyword title, CTA description, self-canonical, indexable", () => {
    expectSeo(kopiSusuEkonomisPage, {
      title: "Biji Kopi Susu Ekonomis untuk Cafe — Agroastery",
      description: /kopi susu ekonomis .* roastery Jakarta Selatan/i,
      canonical: "/kopi-susu-ekonomis",
      noindex: false,
    });
  });
});

describe("/kopi-susu-ekonomis — rendered tags", () => {
  it("emits absolute canonical and no noindex", async () => {
    const { document } = await renderMetaTags(rootLayout, kopiSusuEkonomisPage, {
      segments: ["kopi-susu-ekonomis"],
      pathname: "/kopi-susu-ekonomis",
    });
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href")
    ).toBe("https://agroastery.com/kopi-susu-ekonomis");
    expect(
      document.querySelector('meta[name="robots"][content*="noindex"]')
    ).toBeNull();
  });
});

describe("/kopi-susu-ekonomis — page body", () => {
  it("has exactly one H1 containing the keyword", async () => {
    const html = await renderBody();
    const h1s = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/g) ?? [];
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toContain("Biji Kopi Susu Ekonomis");
  });

  it("grids ONLY Kopi Susu Series products (no filter/merch leakage)", async () => {
    const html = await renderBody();
    expect(html).toContain("/product/biji-kopi-blend-5050-kopi-susu-ekonomis");
    expect(html).toContain("/product/biji-kopi-blend-7030-kopi-susu-ekonomis");
    expect(html).toContain("/product/biji-kopi-full-robusta-kopi-susu-ekonomis");
    expect(html).not.toContain("/product/biji-kopi-seduh-manual-balipeachh");
    expect(html).not.toContain("/product/tumbler-glass-agroastery");
  });

  it("emits BreadcrumbList + CollectionPage JSON-LD with collection items", async () => {
    const blocks = jsonLd(await renderBody());
    const crumb = blocks.find((b) => b["@type"] === "BreadcrumbList");
    expect(crumb?.itemListElement?.[2]).toMatchObject({
      name: "Kopi Susu Ekonomis",
      item: "https://agroastery.com/kopi-susu-ekonomis",
    });
    const collection = blocks.find((b) => b["@type"] === "CollectionPage");
    expect(collection.mainEntity["@type"]).toBe("ItemList");
    expect(collection.mainEntity.itemListElement).toHaveLength(3);
    expect(
      collection.mainEntity.itemListElement[0].item.offers.price
    ).toBeGreaterThan(0);
  });

  it("links to /konsultasi and the supplier page", async () => {
    const html = await renderBody();
    expect(html).toContain('href="/konsultasi"');
    expect(html).toContain('href="/supplier-biji-kopi-cafe"');
  });
});

async function renderBody(): Promise<string> {
  const el = await kopiSusuEkonomisPage.default();
  return renderToStaticMarkup(el as React.ReactElement);
}

function jsonLd(html: string): any[] {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ?? [];
  return m.map((s) => JSON.parse(s.replace(/<\/?script[^>]*>/g, "")));
}
