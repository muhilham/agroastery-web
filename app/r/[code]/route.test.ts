import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { GET, QR_LINKS } from "./route";

function target(code: string) {
  const req = new NextRequest(`https://agroastery.com/r/${code}`);
  return GET(req, { params: Promise.resolve({ code }) });
}

// Frozen print-run content contract (issue #203): the registry values
// themselves, asserted independently of QR_LINKS so a campaign/path typo
// fails CI instead of being self-validated by iterating the same Map.
// Adding a print run REQUIRES editing this snapshot too — code review =
// change control.
const EXPECTED_LINKS: Record<string, { path: string; campaign: string }> = {
  "5050": { path: "/start/blend-50-50/", campaign: "reorder-blend-50-50" },
  "7030": {
    path: "/product/biji-kopi-blend-7030-kopi-susu-ekonomis/",
    campaign: "reorder-blend-70-30",
  },
  "2080": {
    path: "/product/biji-kopi-blend-2080-kopi-susu-ekonomis/",
    campaign: "reorder-blend-20-80",
  },
  fa: {
    path: "/product/biji-kopi-full-arabica-kopi-susu-ekonomis-1-kg-1kg/",
    campaign: "reorder-full-arabica",
  },
  fr: {
    path: "/product/biji-kopi-full-robusta-kopi-susu-ekonomis/",
    campaign: "reorder-full-robusta",
  },
  "house-blend": {
    path: "/product/house-blend-espresso-arabica-fine-robusta-prime73/",
    campaign: "reorder-house-blend-prime73",
  },
  gayo: {
    path: "/product/biji-kopi-standard-gayo-full-arabica/",
    campaign: "reorder-standard-gayo",
  },
  kintamani: {
    path: "/product/biji-kopi-standard-kintamani-full-arabica/",
    campaign: "reorder-standard-kintamani",
  },
};

describe("QR_LINKS registry integrity", () => {
  // app/ route dirs, with route groups like "(root)" transparent — they
  // contribute no URL segment. Expansion happens as a pre-pass before
  // segment matching, so a route that exists ONLY under a group (e.g.
  // app/(root)/katalog) resolves correctly, not just paths with a literal
  // top-level dir.
  function staticRouteExists(pathname: string): boolean {
    const segments = pathname.split("/").filter(Boolean);
    let dirs = [join(process.cwd(), "app")];
    for (const segment of segments) {
      const matched: string[] = [];
      for (let i = 0; i < dirs.length; i++) {
        const stack = [dirs[i]];
        while (stack.length > 0) {
          const dir = stack.pop()!;
          if (!existsSync(dir)) continue;
          for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
              stack.push(join(dir, entry.name)); // group: descend, same segment
            } else if (entry.name === segment) {
              matched.push(join(dir, entry.name));
            }
          }
        }
      }
      if (matched.length === 0) return false;
      dirs = matched;
    }
    return dirs.some(
      (dir) =>
        existsSync(join(dir, "page.tsx")) ||
        existsSync(join(dir, "page.ts")) ||
        existsSync(join(dir, "route.ts")),
    );
  }

  // Resolver self-check: prove the (root)-flattening actually works instead
  // of relying on paths that pass by accident (a real app/start/ dir made
  // the old one-level-late bug invisible for /start/blend-50-50/).
  it("staticRouteExists resolves route-group-only paths and rejects fakes", () => {
    for (const p of ["/katalog/", "/login/", "/checkout/success/"]) {
      expect(staticRouteExists(p), p).toBe(true); // exist only under app/(root)/
    }
    expect(staticRouteExists("/no-such-route/")).toBe(false);
  });

  it("every registered path is absolute and trailing-slashed", () => {
    for (const [code, { path }] of QR_LINKS) {
      expect(path, `code ${code}`).toMatch(/^\//);
      expect(path, `code ${code}`).toMatch(/\/$/);
    }
  });

  it("every registered code is lowercase, url-safe, and case-unique", () => {
    const keys = [...QR_LINKS.keys()];
    // This regex is the load-bearing guard: GET lowercases the incoming
    // code, so a key with uppercase ("FA") would silently shadow "fa".
    for (const code of keys) {
      expect(code).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    }
    // Belt-and-suspenders if the regex above is ever loosened.
    expect(new Set(keys.map((k) => k.toLowerCase())).size).toBe(QR_LINKS.size);
  });

  it("every registered path exists as a static route or documented product slug", () => {
    for (const [code, { path }] of QR_LINKS) {
      if (path.startsWith("/product/")) {
        // Documented exception (see route.ts print-run header): product PDPs
        // are dynamic ([slug]) routes backed by the products table, so they
        // can't be fs-verified here. A retired slug still lands on the 404
        // page with a "Kembali ke Katalog" link — a scan never dead-ends.
        const slug = path.slice("/product/".length, -1);
        expect(slug, `code ${code}`).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        continue;
      }
      expect(staticRouteExists(path), `code ${code} → ${path}`).toBe(true);
    }
  });

  it("has more than the original single-code registry", () => {
    // Print-run v2 pre-registers reorder-card SKUs (issue #203).
    expect(QR_LINKS.size).toBeGreaterThan(1);
    expect(QR_LINKS.has("5050")).toBe(true);
  });
});

describe("GET /r/[code] — printed-QR short links", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  afterEach(() => {
    if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it("redirects known code to its guide page with card/qr UTM", async () => {
    const res = await target("5050");
    expect(res.status).toBe(302);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.origin + loc.pathname).toBe(
      "https://agroastery.com/start/blend-50-50/",
    );
    expect(loc.searchParams.get("utm_source")).toBe("card");
    expect(loc.searchParams.get("utm_medium")).toBe("qr");
    expect(loc.searchParams.get("utm_campaign")).toBe("reorder-blend-50-50");
  });

  it("every registered code redirects to the pinned print-run target + campaign", async () => {
    // Key sets must match: an entry added without updating EXPECTED_LINKS
    // (or a removed code left in the snapshot) fails here, not silently.
    expect([...QR_LINKS.keys()].sort()).toEqual(
      Object.keys(EXPECTED_LINKS).sort(),
    );
    for (const [code, expected] of Object.entries(EXPECTED_LINKS)) {
      const res = await target(code.toUpperCase());
      expect(res.status, code).toBe(302);
      const loc = new URL(res.headers.get("location")!);
      expect(loc.pathname, code).toBe(expected.path);
      expect(loc.searchParams.get("utm_source"), code).toBe("card");
      expect(loc.searchParams.get("utm_medium"), code).toBe("qr");
      expect(loc.searchParams.get("utm_campaign"), code).toBe(
        expected.campaign,
      );
    }
  });

  it("honors NEXT_PUBLIC_SITE_URL so staging never redirects to prod", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://staging.agroastery.com";
    const res = await target("5050");
    const loc = new URL(res.headers.get("location")!);
    expect(loc.origin).toBe("https://staging.agroastery.com");
  });

  it("reserved object keys fall back, not resolve to prototype members", async () => {
    // Regression: `QR_LINKS[code]` on a plain object returns the Object
    // constructor for "constructor", producing a /undefined redirect.
    for (const code of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      const res = await target(code);
      const loc = new URL(res.headers.get("location")!);
      expect(loc.pathname).toBe("/katalog/");
      expect(loc.searchParams.get("utm_campaign")).toBe("qr-unknown");
    }
  });

  it("unknown codes fall back to catalog, still tagged as QR traffic", async () => {
    const res = await target("does-not-exist");
    expect(res.status).toBe(302);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/katalog/");
    expect(loc.searchParams.get("utm_campaign")).toBe("qr-unknown");
  });
});
