/**
 * /track/* SEO regression tests (issue #177).
 *
 * GA4 showed organic sessions landing on /track/{uuid}/ — both track routes
 * must render `noindex, follow`. Object level + DOM level (renderMetaTags).
 */
import { describe, it, expect, vi } from "vitest";

// Server pages only need their static metadata here; avoid constructing a
// real Supabase client at import time.
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import * as trackLookupPage from "./page";
import * as trackOrderPage from "./[orderId]/page";
import * as rootLayout from "@/app/layout";
import { expectSeo, renderMetaTags } from "@/lib/testing/seo";

describe("/track metadata — object level", () => {
  it.each([
    ["lookup", trackLookupPage],
    ["order", trackOrderPage],
  ])("keeps /track/%s noindex, follow", (_route, page) => {
    expectSeo(page, { title: "Lacak Pesanan", noindex: true });
    expect(page.metadata?.robots).toMatchObject({ index: false, follow: true });
  });
});

describe("/track metadata — rendered tags", () => {
  it.each([
    ["/track", [], "/track"],
    ["/track/{uuid}", ["track", "[orderId]"], "/track/00000000-0000-0000-0000-000000000000"],
  ])("renders robots noindex, follow on %s", async (_label, segments, pathname) => {
    const page = segments.length ? trackOrderPage : trackLookupPage;
    const { document } = await renderMetaTags(rootLayout, page, {
      segments,
      pathname,
    });
    const robots = document
      .querySelector('meta[name="robots"]')
      ?.getAttribute("content");
    expect(robots).toMatch(/noindex/i);
    expect(robots).toMatch(/follow/i);
    expect(document.querySelector("title")?.textContent).toContain(
      "Lacak Pesanan",
    );
  });
});
