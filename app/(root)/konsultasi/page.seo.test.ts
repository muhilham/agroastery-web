/**
 * /konsultasi SEO regression tests (issue #133, checklist #123 items 4-10).
 *
 * Object level: the exported metadata. DOM level: the tags Next actually
 * renders after resolution (metadataBase absolutization, og inheritance,
 * robots meta).
 */
import { describe, it, expect } from "vitest";
import * as konsultasiPage from "@/app/(root)/konsultasi/page";
import * as konsultasiLayout from "@/app/layout";
import { expectSeo, renderMetaTags } from "@/lib/testing/seo";

const OG_IMAGE_URL =
  "https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e";

describe("/konsultasi metadata — object level", () => {
  it("matches the #123 checklist", () => {
    expectSeo(konsultasiPage, {
      title: "Konsultasi Kopi untuk Cafe",
      description: /konsultasi kopi .* roastery Jakarta Selatan/i,
      canonical: "/konsultasi",
      noindex: false,
      ogImage: OG_IMAGE_URL,
    });
  });

  it("keeps Jakarta Selatan + wholesale keywords in the description", () => {
    const desc = String(konsultasiPage.metadata?.description ?? "");
    expect(desc).toContain("Jakarta Selatan");
    expect(desc.toLowerCase()).toContain("wholesale");
  });
});

describe("/konsultasi metadata — rendered tags", () => {
  it("emits title, description, absolute canonical, og:image, twitter card", async () => {
    const { document } = await renderMetaTags(konsultasiLayout, konsultasiPage, {
      segments: ["konsultasi"],
      pathname: "/konsultasi",
    });

    expect(document.querySelector("title")?.textContent).toContain(
      "Konsultasi Kopi untuk Cafe",
    );
    expect(
      document.querySelector('meta[name="description"]')?.getAttribute("content"),
    ).toContain("Jakarta Selatan");

    // Canonical must come out absolute — metadataBase resolution is the point.
    const canonical = document
      .querySelector('link[rel="canonical"]')
      ?.getAttribute("href");
    expect(canonical).toBe("https://agroastery.com/konsultasi");

    expect(
      document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content"),
    ).toBe(OG_IMAGE_URL);
    expect(
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content"),
    ).toContain("Konsultasi");
    expect(
      document
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content"),
    ).toContain("Jakarta Selatan");
    expect(
      document
        .querySelector('meta[name="twitter:card"]')
        ?.getAttribute("content"),
    ).toBe("summary_large_image");

    // Public page: no robots noindex tag.
    expect(
      document.querySelector('meta[name="robots"][content*="noindex"]'),
    ).toBeNull();
  });
});
