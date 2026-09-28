import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

function target(code: string) {
  const req = new NextRequest(`https://agroastery.com/r/${code}`);
  return GET(req, { params: Promise.resolve({ code }) });
}

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
