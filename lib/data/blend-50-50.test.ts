// lib/data/blend-50-50.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { trackEvent } from "@/lib/analytics/gtag";

vi.mock("@/lib/analytics/gtag", () => ({
  trackEvent: vi.fn(),
}));

import {
  trackBlendEvent,
  PRODUCT_SLUG,
  CONTENT_VERSION,
  recipes,
  ingredients,
  troubleshooting,
} from "./blend-50-50";

describe("blend-50-50 content", () => {
  it("has exactly 3 recipes with unique ids", () => {
    expect(recipes).toHaveLength(3);
    expect(new Set(recipes.map((r) => r.id)).size).toBe(3);
    expect(recipes.map((r) => r.id).sort()).toEqual(
      ["es_kopi_susu", "espresso", "iced_americano"].sort()
    );
  });

  it("has ingredients and troubleshooting entries", () => {
    expect(ingredients.length).toBeGreaterThan(0);
    expect(troubleshooting).toHaveLength(4);
  });
});

describe("trackBlendEvent", () => {
  afterEach(() => {
    vi.mocked(trackEvent).mockClear();
  });

  it("merges product and version into every event", () => {
    trackBlendEvent("whatsapp_clicked");
    expect(trackEvent).toHaveBeenCalledWith("whatsapp_clicked", {
      product: PRODUCT_SLUG,
      version: CONTENT_VERSION,
    });
  });

  it("merges extra params without overwriting product/version", () => {
    trackBlendEvent("brew_guide_viewed", { brew_method: "espresso" });
    expect(trackEvent).toHaveBeenCalledWith("brew_guide_viewed", {
      product: PRODUCT_SLUG,
      version: CONTENT_VERSION,
      brew_method: "espresso",
    });
  });
});
