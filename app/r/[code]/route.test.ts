import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { GET, QR_LINKS } from "./route";

function target(code: string) {
  const req = new NextRequest(`https://agroastery.com/r/${code}`);
  return GET(req, { params: Promise.resolve({ code }) });
}

describe("QR_LINKS registry integrity", () => {
  // app/ route dirs, with (root) flattened away — route paths are
  // relative to the public URL space, not the folder layout.
  function staticRouteExists(pathname: string): boolean {
    const segments = pathname.split("/").filter(Boolean);
    let dirs = [join(process.cwd(), "app")];
    for (const segment of segments) {
      const next: string[] = [];
      for (const dir of dirs) {
        if (!existsSync(dir)) continue;
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          // Route groups like "(root)" contribute no URL segment.
          if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
            next.push(join(dir, entry.name));
            continue;
          }
          if (entry.name === segment) next.push(join(dir, entry.name));
        }
      }
      if (next.length === 0) return false;
      dirs = next;
    }
    return dirs.some(
      (dir) =>
        existsSync(join(dir, "page.tsx")) ||
        existsSync(join(dir, "page.ts")) ||
        existsSync(join(dir, "route.ts")),
    );
  }

  it("every registered path is absolute and trailing-slashed", () => {
    for (const [code, { path }] of QR_LINKS) {
      expect(path, `code ${code}`).toMatch(/^\//);
      expect(path, `code ${code}`).toMatch(/\/$/);
    }
  });

  it("every registered code is lowercase, url-safe, and case-unique", () => {
    const keys = [...QR_LINKS.keys()];
    for (const code of keys) {
      expect(code).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    }
    // GET lowercases the incoming code before lookup, so two keys differing
    // only in case (e.g. "FA" vs "fa") would silently shadow one another.
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

  it("every registered code redirects to its own path + campaign", async () => {
    for (const [code, { path, campaign }] of QR_LINKS) {
      const res = await target(code.toUpperCase());
      expect(res.status, code).toBe(302);
      const loc = new URL(res.headers.get("location")!);
      expect(loc.pathname, code).toBe(path);
      expect(loc.searchParams.get("utm_campaign"), code).toBe(campaign);
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
