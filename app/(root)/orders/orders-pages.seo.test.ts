/**
 * /orders SEO regression tests (issue #237).
 *
 * GA4 showed an organic landing on /orders/<uuid>. The detail route shipped
 * no robots metadata, and the list/detail noindex metas were unreachable
 * because robots.txt disallowed /orders/ (a disallow blocks the crawl, so
 * Google can never read noindex — the exact defect #177 fixed for
 * /checkout/). Both routes must now resolve `noindex` as framework-served
 * HTML meta. Two tiers, per AGENTS.md SEO layering: object level catches a
 * missing/changed `metadata` export (mutation-proven), DOM level
 * (`renderMetaTags`) catches what actually renders after Next's metadata
 * resolution — inheritance, merging, and robots serialization.
 */
import { describe, it, expect, vi } from "vitest";

// Server pages only need their static metadata here; avoid constructing a
// real Supabase client at import time.
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
}));

import * as ordersListPage from "./page";
import * as ordersDetailPage from "./[id]/page";
import * as rootLayout from "@/app/layout";
import { expectSeo, renderMetaTags } from "@/lib/testing/seo";

const ORDER_URL = "/orders/00000000-0000-0000-0000-000000000000";

describe("/orders metadata — object level (issue #237)", () => {
  it("keeps /orders (list) noindex", () => {
    expectSeo(ordersListPage, { title: "Pesanan Saya", noindex: true });
  });

  it("keeps /orders/[id] (detail) noindex, follow", () => {
    expectSeo(ordersDetailPage, { noindex: true });
    expect(ordersDetailPage.metadata?.robots).toMatchObject({
      index: false,
      follow: true,
    });
  });
});

describe("/orders metadata — rendered tags (issue #237)", () => {
  it.each([
    ["/orders", ["orders"], "/orders"],
    ["/orders/{uuid}", ["orders", "[id]"], ORDER_URL],
  ])("renders robots noindex on %s", async (_label, segments, pathname) => {
    const page = segments.length > 1 ? ordersDetailPage : ordersListPage;
    const { document } = await renderMetaTags(rootLayout, page, {
      segments,
      pathname,
    });
    const robots = document
      .querySelector('meta[name="robots"]')
      ?.getAttribute("content");
    expect(robots, `${pathname} must emit a robots meta`).toMatch(/noindex/i);
    expect(document.querySelector("title")?.textContent).toMatch(/Pesanan/i);
  });
});
