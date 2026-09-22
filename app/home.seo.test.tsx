/**
 * Homepage SEO regression tests (issue #177).
 *
 * 1. Canonical: "/" had no <link rel="canonical"> despite metadataBase —
 *    metadataBase only absolutizes relative URLs a segment declares, and no
 *    homepage metadata existed at all (client page). app/page.tsx is now a
 *    server wrapper; assert the resolved absolute canonical via renderMetaTags.
 * 2. H1: the decorative hero line was the only H1. The keyword H1 lives in
 *    the client hero (app/home.tsx), outside the metadata layer, so assert it
 *    with a direct component render.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(),
}));
// Same convention as checkout component tests: chrome is irrelevant to the
// hero assertions and Navigation pulls in the auth hook (real browser client).
vi.mock("@/components/navigation", () => ({ default: () => null }));
vi.mock("@/components/ui/footer", () => ({ Footer: () => null }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

import * as homePage from "@/app/page";
import * as rootLayout from "@/app/layout";
import Home from "@/app/home";
import { expectSeo, renderMetaTags } from "@/lib/testing/seo";

const H1_TEXT = "Supplier Biji Kopi Specialty untuk Cafe di Jakarta Selatan";

describe("homepage metadata — object level", () => {
  it("declares an explicit root canonical", () => {
    expectSeo(homePage, { canonical: "/" });
  });
});

describe("homepage metadata — rendered tags", () => {
  it("emits an absolute canonical + inherited title/description, no robots noindex", async () => {
    const { document } = await renderMetaTags(rootLayout, homePage, {
      segments: [],
      pathname: "/",
    });
    // Next's resolveAbsoluteUrlWithPathname deliberately collapses a root URL
    // with no query to `metadataBase.origin` (no trailing slash) — verified
    // against next/dist/lib/metadata/resolvers/resolve-url.js.
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toBe("https://agroastery.com");
    expect(document.querySelector("title")?.textContent).toContain(
      "Biji Kopi Specialty untuk Cafe",
    );
    expect(
      document.querySelector('meta[name="description"]')?.getAttribute("content"),
    ).toContain("Jakarta Selatan");
    // Public page: must stay indexable.
    expect(
      document.querySelector('meta[name="robots"][content*="noindex"]'),
    ).toBeNull();
  });
});

describe("homepage H1", () => {
  it("renders the keyword-bearing H1 exactly once", () => {
    render(<Home />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe(H1_TEXT);
  });

  it("keeps the decorative hero line visible as a non-h1 element", () => {
    render(<Home />);
    const hero = screen.getByText("CRAFTING THE FINEST STANDARD");
    expect(hero.tagName).not.toBe("H1");
    // Same visual styling as before the demotion.
    expect(hero.className).toContain("text-5xl");
  });
});
