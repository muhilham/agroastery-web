/**
 * Issue #178 coverage for /roasted-for-filter — metadata (object + rendered tags) and
 * page body (one H1, JSON-LD, wiring) against a mocked catalog fixture.
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

// Chrome around the page body — out of scope for these tests.
vi.mock("@/components/navigation", () => ({ default: () => null }));
vi.mock("@/components/ui/footer", () => ({ Footer: () => null }));
// ProductCard is a client component; useRouter has no router outside the app.
vi.mock("next/navigation", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  useRouter: () => ({ push: vi.fn() }),
}));


import * as roastedForFilterPage from "@/app/(root)/roasted-for-filter/page";
import * as rootLayout from "@/app/layout";
import { expectSeo, renderMetaTags } from "@/lib/testing/seo";


describe("/roasted-for-filter metadata — object level", () => {
  it("keyword title, CTA description, self-canonical, indexable", () => {
    expectSeo(roastedForFilterPage, {
      title: "Roasted for Filter — Biji Kopi Seduh Manual — Agroastery",
      description: /seduh manual .* roastery Jakarta Selatan/i,
      canonical: "/roasted-for-filter",
      noindex: false,
    });
  });
});

describe("/roasted-for-filter — rendered tags", () => {
  it("emits absolute canonical and no noindex", async () => {
    const { document } = await renderMetaTags(rootLayout, roastedForFilterPage, {
      segments: ["roasted-for-filter"],
      pathname: "/roasted-for-filter",
    });
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href")
    ).toBe("https://agroastery.com/roasted-for-filter");
    expect(
      document.querySelector('meta[name="robots"][content*="noindex"]')
    ).toBeNull();
  });
});


describe("/roasted-for-filter — page body", () => {
  it("has exactly one H1 containing the keyword", async () => {
    const html = await renderBody();
    const h1s = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/g) ?? [];
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toContain("Roasted for Filter");
  });

  it("grids ONLY Roasted for Filter products", async () => {
    const html = await renderBody();
    expect(html).toContain(
      "/product/biji-kopi-ethiopia-oromia-roasted-for-filter-by-agroastery-150gr"
    );
    expect(html).toContain("/product/biji-kopi-seduh-manual-balipeachh");
    expect(html).toContain("/product/biji-kopi-standard-gayo-full-arabica");
    expect(html).not.toContain("/product/biji-kopi-blend-5050");
    expect(html).not.toContain("/product/tumbler-glass-agroastery");
  });

  it("emits BreadcrumbList + CollectionPage JSON-LD", async () => {
    const blocks = jsonLdBlocks(await renderBody());
    const crumb = blocks.find((b) => b["@type"] === "BreadcrumbList");
    expect(crumb?.itemListElement?.[2]).toMatchObject({
      name: "Roasted for Filter",
      item: "https://agroastery.com/roasted-for-filter",
    });
    const collection = blocks.find((b) => b["@type"] === "CollectionPage");
    expect(collection.mainEntity["@type"]).toBe("ItemList");
    expect(collection.mainEntity.itemListElement).toHaveLength(3);
  });

  it("links to /konsultasi, /kopi-susu-ekonomis, and /supplier-biji-kopi-cafe", async () => {
    const html = await renderBody();
    expect(html).toContain('href="/konsultasi"');
    expect(html).toContain('href="/kopi-susu-ekonomis"');
    expect(html).toContain('href="/supplier-biji-kopi-cafe"');
  });
});


async function renderBody(): Promise<string> {
  const el = await roastedForFilterPage.default();
  return renderToStaticMarkup(el as React.ReactElement);
}

function jsonLdBlocks(html: string): any[] {
  const m =
    html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ??
    [];
  return m.map((s) => JSON.parse(s.replace(/<\/?script[^>]*>/g, "")));
}
