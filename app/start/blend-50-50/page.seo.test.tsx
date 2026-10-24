/**
 * Issue #235 — /start/blend-50-50 SEO regression tests.
 *
 * Pre-fix state (curl-verified 2026-10): title/description existed but the
 * page emitted ZERO JSON-LD (despite 4 exact recipes with dose/yield/time)
 * and no canonical; the brand rendered "AGRoastery" vs "Agroastery" on the
 * PDP — citation-consistency break for AI engines that quote both pages.
 */
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as startPage from "./page";
import * as rootLayout from "@/app/layout";
import { recipes } from "@/lib/data/blend-50-50";
import { recipeJsonLd } from "@/lib/seo/recipe-jsonld";
import { expectSeo, renderMetaTags } from "@/lib/testing/seo";

// ViewTracker/OnboardingStartTracker need it in jsdom (same fake as page.test.tsx).
class FakeIntersectionObserver {
  callback: IntersectionObserverCallback;
  observe = () => {};
  disconnect = () => {};
  unobserve = () => {};
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
}

function ldBlocks(html: string): any[] {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ?? [];
  return m.map((s) => JSON.parse(s.replace(/<\/?script[^>]*>/g, "")));
}

function renderBody(): string {
  // @ts-expect-error jsdom has no real IntersectionObserver
  globalThis.IntersectionObserver = FakeIntersectionObserver;
  return renderToStaticMarkup(React.createElement(startPage.default as React.ComponentType));
}

describe("/start/blend-50-50 metadata — object level", () => {
  it("normalized brand + self-canonical + indexable", () => {
    expectSeo(startPage, {
      title: "Panduan Seduh Blend 50:50 | Agroastery",
      canonical: "/start/blend-50-50",
      noindex: false,
    });
    expect(String(startPage.metadata.title)).not.toMatch(/AGRoastery/);
    expect(String(startPage.metadata.description)).toContain("es kopi susu");
  });
});

describe("/start/blend-50-50 — resolved tags via Next metadata layer", () => {
  it("emits absolute canonical with trailing slash on the real domain", async () => {
    const { document } = await renderMetaTags(rootLayout, startPage, {
      segments: ["start", "blend-50-50"],
      pathname: "/start/blend-50-50",
    });
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute("href")).toMatch(
      /^https:\/\/agroastery\.com\/start\/blend-50-50\/?$/
    );
  });
});

describe("/start/blend-50-50 — Recipe JSON-LD", () => {
  it("serves exactly 4 Recipe blocks, one per visible recipe", () => {
    const html = renderBody();
    const recipes = ldBlocks(html).filter((j) => j["@type"] === "Recipe");
    expect(recipes.length).toBe(4);
    expect(recipes.map((r) => r.name)).toEqual([
      "Espresso dengan Blend 50:50",
      "Iced Americano dengan Blend 50:50",
      "Es Kopi Susu dengan Blend 50:50",
      "Mokapot dengan Blend 50:50",
    ]);
  });

  it("brand string is 'Agroastery' in every Recipe node (citation consistency)", () => {
    for (const r of recipes) {
      const ld = recipeJsonLd(r);
      expect((ld.author as any).name).toBe("Agroastery");
      expect((ld.publisher as any).name).toBe("Agroastery");
    }
  });

  it("JSON-LD ingredients match the visible card values (parity rule)", () => {
    const html = renderBody();
    const esKopiSusu = ldBlocks(html)
      .filter((j) => j["@type"] === "Recipe")
      .find((r) => r.name.startsWith("Es Kopi Susu"));
    expect(esKopiSusu.recipeIngredient).toEqual(
      expect.arrayContaining(["30g Liquid Creamer", "1 shot Espresso", "150g Es"])
    );
    for (const ing of esKopiSusu.recipeIngredient as string[]) {
      expect(html).toContain(ing.split(" ").slice(1).join(" ")); // label visible on card
      expect(html).toContain(ing.split(" ")[0]); // quantity visible on card
    }
  });

  it("espresso dose (not Yield) becomes the ingredient; extraction params stay in instructions", () => {
    const espresso = recipeJsonLd(recipes[0]);
    expect(espresso.recipeIngredient).toEqual(["18g biji kopi Blend 50:50"]);
    const texts = (espresso.recipeInstructions as any[]).map((i) => i.text);
    expect(texts).toContain("Dose: 18g");
    expect(texts).toContain("Yield: 40g");
    expect(texts).toContain("Waktu: 26–29 detik");
  });

  it("each Recipe points at its own on-page section anchor", () => {
    expect(recipeJsonLd(recipes[2]).url).toBe(
      "https://agroastery.com/start/blend-50-50#es-kopi-susu"
    );
  });

  it("visible DOM no longer renders the 'AGRoastery' brand variant", () => {
    const html = renderBody();
    expect(html).not.toContain("AGRoastery");
    expect(html).toContain("Agroastery");
  });
});
