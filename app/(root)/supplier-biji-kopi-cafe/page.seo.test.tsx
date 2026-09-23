/**
 * Issue #178 coverage for /supplier-biji-kopi-cafe — the B2B money page.
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


import * as supplierCafePage from "@/app/(root)/supplier-biji-kopi-cafe/page";
import * as rootLayout from "@/app/layout";
import { expectSeo, renderMetaTags } from "@/lib/testing/seo";


describe("/supplier-biji-kopi-cafe metadata — object level", () => {
  it("keyword title, CTA description, self-canonical, indexable", () => {
    expectSeo(supplierCafePage, {
      title: "Supplier Biji Kopi untuk Cafe — Agroastery",
      description: /supplier biji kopi specialty untuk cafe di Jakarta/i,
      canonical: "/supplier-biji-kopi-cafe",
      noindex: false,
    });
  });

  it("description carries a CTA (konsultasi/wholesale)", () => {
    const desc = String(supplierCafePage.metadata?.description ?? "");
    expect(desc.toLowerCase()).toMatch(/konsultasi|wholesale/);
  });
});

describe("/supplier-biji-kopi-cafe — rendered tags", () => {
  it("emits absolute canonical and no noindex", async () => {
    const { document } = await renderMetaTags(rootLayout, supplierCafePage, {
      segments: ["supplier-biji-kopi-cafe"],
      pathname: "/supplier-biji-kopi-cafe",
    });
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href")
    ).toBe("https://agroastery.com/supplier-biji-kopi-cafe");
    expect(
      document.querySelector('meta[name="robots"][content*="noindex"]')
    ).toBeNull();
  });
});


describe("/supplier-biji-kopi-cafe — page body", () => {
  it("has exactly one H1 containing the keyword", async () => {
    const html = await renderBody();
    const h1s = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/g) ?? [];
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toContain("Supplier Biji Kopi untuk Cafe");
  });

  it("is a substantive money page (>= 800 words of visible copy)", async () => {
    const text = (await renderBody())
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<[^>]+>/g, " ");
    const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
    expect(words.length).toBeGreaterThanOrEqual(800);
  });

  it("covers the brief: tiers, MOQ, delivery, blend program", async () => {
    const html = await renderBody();
    expect(html).toMatch(/wholesale/i);
    expect(html).toMatch(/minimum order/i);
    expect(html).toMatch(/Jakarta|Jabodetabek/);
    expect(html).toMatch(/blend/i);
  });

  it("emits BreadcrumbList JSON-LD rooted at the page", async () => {
    const blocks = jsonLdBlocks(await renderBody());
    const crumb = blocks.find((b) => b["@type"] === "BreadcrumbList");
    expect(crumb?.itemListElement?.[1]).toMatchObject({
      name: "Supplier Biji Kopi Cafe",
      item: "https://agroastery.com/supplier-biji-kopi-cafe",
    });
  });

  it("links to /konsultasi twice (hero + program) and to real products", async () => {
    const html = await renderBody();
    expect((html.match(/href="\/konsultasi"/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(html).toContain("/product/biji-kopi-blend-5050-kopi-susu-ekonomis");
    expect(html).toContain("/product/biji-kopi-standard-gayo-full-arabica");
  });
});


async function renderBody(): Promise<string> {
  const el = await supplierCafePage.default();
  return renderToStaticMarkup(el as React.ReactElement);
}

function jsonLdBlocks(html: string): any[] {
  const m =
    html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ??
    [];
  return m.map((s) => JSON.parse(s.replace(/<\/?script[^>]*>/g, "")));
}
