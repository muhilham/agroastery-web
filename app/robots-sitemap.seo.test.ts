/**
 * robots.txt + sitemap consistency guard (issue #177 review follow-up).
 *
 * Two invariants that de-indexing depends on:
 * 1. The default bot rule (userAgent "*") must NOT disallow /checkout/ —
 *    Google can only honor the pages' noindex meta if it can crawl them;
 *    a disallow would keep already-indexed /checkout/* URLs stuck in the
 *    index. (AI-crawler rules intentionally still disallow it.)
 * 2. The sitemap must not advertise URLs that are noindex (/track, /cart) —
 *    a sitemap entry contradicts the meta tag and re-invites crawling.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          not: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  })),
}));

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("robots.txt — de-indexing strategy (issue #177)", () => {
  it("default bot rule can crawl /checkout/ (noindex meta does the work)", async () => {
    const rules = (await robots()).rules ?? [];
    const list = Array.isArray(rules) ? rules : [rules];
    const defaultRule = list.find(
      (rule) => rule.userAgent === "*",
    );
    expect(defaultRule).toBeDefined();
    const disallow = defaultRule!.disallow ?? [];
    const flat = Array.isArray(disallow) ? disallow : [disallow];
    expect(flat).not.toContain("/checkout/");
    // Private areas that carry no noindex fallback must stay disallowed.
    for (const path of ["/api/", "/account/", "/orders/", "/login/"]) {
      expect(flat).toContain(path);
    }
  });
});

describe("sitemap — excludes noindex pages (issue #177)", () => {
  it("does not advertise /track or /cart", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls.some((u) => u.endsWith("/track"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/cart"))).toBe(false);
    // Homepage + core indexable pages remain.
    expect(urls.some((u) => u.endsWith("/katalog"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/konsultasi"))).toBe(true);
  });
});
