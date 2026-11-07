/**
 * robots.txt + sitemap consistency guard (issue #177 review follow-up,
 * extended by issue #237).
 *
 * Invariants that de-indexing depends on:
 * 1. The default bot rule (userAgent "*") must NOT disallow paths whose pages
 *    ship a noindex fallback (/checkout/, /account/, /orders/) — Google can
 *    only honor the noindex meta if it can crawl the page; a disallow keeps
 *    already-indexed URLs stuck in the index. (#237 found /account/ and
 *    /orders/ had exactly this defect: live 200 + noindex meta, unreachable
 *    to Googlebot behind the disallow.)
 * 2. Paths with NO noindex fallback (/api/, /login/) must stay disallowed.
 * 3. AI-crawler rules keep every private path disallowed regardless.
 * 4. The sitemap must not advertise URLs that are noindex (/track, /cart) —
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

describe("robots.txt — de-indexing strategy (issue #177 + #237)", () => {
  it("default bot rule can crawl every path that ships a noindex fallback", async () => {
    const rules = (await robots()).rules ?? [];
    const list = Array.isArray(rules) ? rules : [rules];
    const defaultRule = list.find(
      (rule) => rule.userAgent === "*",
    );
    expect(defaultRule).toBeDefined();
    const disallow = defaultRule!.disallow ?? [];
    const flat = Array.isArray(disallow) ? disallow : [disallow];

    // These pages carry their own noindex meta; a disallow would make that
    // meta unreachable and keep indexed URLs stuck (issues #177, #237).
    for (const path of ["/checkout/", "/account/", "/orders/"]) {
      expect(flat, `${path} must stay crawlable so its noindex applies`).not.toContain(path);
    }

    // Paths with NO noindex fallback stay disallowed. /login/ is a "use
    // client" page with no metadata export and zero organic landings (#237).
    for (const path of ["/api/", "/login/"]) {
      expect(flat).toContain(path);
    }
  });

  it("AI-crawler rules keep all private paths disallowed (#237)", async () => {
    const rules = (await robots()).rules ?? [];
    const list = Array.isArray(rules) ? rules : [rules];
    const privatePaths = [
      "/api/",
      "/checkout/",
      "/track/",
      "/account/",
      "/orders/",
      "/login/",
    ];
    // Every named AI/LLM crawler rule must still block private areas, even
    // though the "*" rule now lets /account/ and /orders/ be crawled for
    // noindex de-indexing.
    const aiRules = list.filter(
      (rule) => rule.userAgent !== "*" && rule.userAgent !== "Bytespider",
    );
    expect(aiRules.length).toBeGreaterThanOrEqual(4);
    for (const rule of aiRules) {
      const disallow = rule.disallow ?? [];
      const flat = Array.isArray(disallow) ? disallow : [disallow];
      for (const path of privatePaths) {
        expect(flat, `${String(rule.userAgent)} must block ${path}`).toContain(path);
      }
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
