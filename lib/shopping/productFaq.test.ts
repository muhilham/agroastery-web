/**
 * Issue #235 — intent FAQ builder unit tests (pure, no rendering).
 * Fixtures mirror the LIVE 5050 product shape (verified via Supabase REST
 * 2026-10-24): options "Size" (100gram/200gram/500gram/1Kg) x "Varian"
 * (Whole Beans/Grind Fine/Grind Medium/Grind Coarse), kg pack 218.000.
 */
import { describe, it, expect } from "vitest";
import {
  purchasablePackPrices,
  priceAnchor,
  productFaqs,
  milkMenuMatch,
  idr,
} from "./productFaq";

const SIZE_OPT = {
  id: "o-size",
  name: "Size",
  product_option_values: [
    { id: "s100", value: "100gram" },
    { id: "s200", value: "200gram" },
    { id: "s500", value: "500gram" },
    { id: "s1kg", value: "1Kg" },
  ],
};
const VAR_OPT = {
  id: "o-var",
  name: "Varian",
  product_option_values: [
    { id: "v-beans", value: "Whole Beans" },
    { id: "v-fine", value: "Grind Fine" },
    { id: "v-med", value: "Grind Medium" },
    { id: "v-coarse", value: "Grind Coarse" },
  ],
};

function variant(sizeId: string, varId: string, price: number, stock = 10) {
  return {
    id: `${sizeId}-${varId}`,
    price,
    stock_quantity: stock,
    is_active: true,
    product_variant_option_values: [{ option_value_id: sizeId }, { option_value_id: varId }],
  };
}

const live5050 = {
  name: "Biji Kopi Blend 50/50 Kopi Susu Ekonomis",
  description:
    "<p>Di rekomendasikan untuk menu es kopi susu aren dengan 50% Arabica dan 50% Robusta.</p>",
  product_options: [SIZE_OPT, VAR_OPT],
  product_variants: [
    variant("s100", "v-beans", 33000),
    variant("s100", "v-fine", 33500),
    variant("s200", "v-beans", 55000),
    variant("s500", "v-beans", 120000),
    variant("s1kg", "v-beans", 218000),
    variant("s1kg", "v-med", 219000),
  ],
};

describe("purchasablePackPrices — live 5050 shape", () => {
  it("maps grams -> cheapest Whole Beans price per size", () => {
    const packs = purchasablePackPrices(live5050);
    expect(packs.get(100)).toBe(33000); // not 33500 — ground surcharge ignored
    expect(packs.get(500)).toBe(120000);
    expect(packs.get(1000)).toBe(218000);
  });

  it("drops sizes with zero stock (FAQ must not advertise unbuyable prices)", () => {
    const noKg = {
      ...live5050,
      product_variants: live5050.product_variants.map((v) =>
        v.product_variant_option_values?.some((l) => l.option_value_id === "s1kg")
          ? { ...v, stock_quantity: 0 }
          : v
      ),
    };
    expect(purchasablePackPrices(noKg).has(1000)).toBe(false);
  });

  it("uses discounted_price when present", () => {
    const discounted = {
      ...live5050,
      product_variants: live5050.product_variants.map((v) =>
        v.product_variant_option_values?.some((l) => l.option_value_id === "s1kg") &&
        v.product_variant_option_values?.some((l) => l.option_value_id === "v-beans")
          ? { ...v, discounted_price: 191350 }
          : v
      ),
    };
    expect(purchasablePackPrices(discounted).get(1000)).toBe(191350);
  });
});

describe("priceAnchor", () => {
  it("prefers the real 1 kg pack over anything extrapolated", () => {
    const anchor = priceAnchor(purchasablePackPrices(live5050));
    expect(anchor).toEqual({ kind: "kg", price: 218000 });
  });

  it("falls back to the largest purchasable pack (never a per-kg invention)", () => {
    const packs = purchasablePackPrices({
      ...live5050,
      product_variants: live5050.product_variants.filter(
        (v) => !v.product_variant_option_values?.some((l) => l.option_value_id === "s1kg")
      ),
    });
    expect(priceAnchor(packs)).toEqual({ kind: "pack", grams: 500, price: 120000 });
  });

  it("returns null with no sized packs at all", () => {
    expect(priceAnchor(new Map())).toBeNull();
  });
});

describe("productFaqs", () => {
  it("starts with the intent questions for milk-menu blends", () => {
    const qs = productFaqs(live5050).map((f) => f.question);
    expect(qs[0]).toBe("Kopi apa yang cocok untuk es kopi susu ekonomis?");
    expect(qs).toContain("Arabica atau robusta untuk menu susu?");
    expect(qs).toContain(
      "Berapa harga biji kopi Blend 50/50 Kopi Susu Ekonomis per kilo?"
    );
  });

  it("kg price question quotes the live purchasable kg pack", () => {
    const faq = productFaqs(live5050).find((f) => /per kilo\?$/.test(f.question));
    expect(faq?.answer).toContain(idr(218000)); // Rp218.000
    expect(faq?.answer).not.toContain(idr(33000)); // never the 100g price
  });

  it("pack-price question replaces the per-kilo claim when no kg pack is buyable", () => {
    const noKg = {
      ...live5050,
      product_variants: live5050.product_variants.filter(
        (v) => !v.product_variant_option_values?.some((l) => l.option_value_id === "s1kg")
      ),
    };
    const qs = productFaqs(noKg).map((f) => f.question);
    expect(qs.some((q) => /per kilo\?$/.test(q))).toBe(false);
    expect(qs).toContain("Berapa harga Biji Kopi Blend 50/50 Kopi Susu Ekonomis?");
  });

  it("quotes the blend ratio from the product, not from hardcode (sibling blends stay true)", () => {
    const blend2080 = {
      ...live5050,
      name: "Biji Kopi Blend 20/80 Kopi Susu",
      description: "<p>20% Arabica dan 80% Robusta untuk menu kopi susu.</p>",
    };
    const first = productFaqs(blend2080)[0];
    expect(first.answer).toContain("blend 20% Arabica dan 80% Robusta");
    expect(first.answer).not.toContain("50%");
  });

  it("lists grind choices from the Varian axis values", () => {
    const faq = productFaqs(live5050).find((f) => /bisa digiling/.test(f.question));
    expect(faq?.answer).toContain("Grind Fine, Grind Medium, Grind Coarse");
    expect(faq?.answer).not.toContain("Whole Beans, Grind");
  });

  it("non-milk single origin gets no milk-menu intent questions", () => {
    const filter = {
      name: "Arabica Gayo Wine",
      description: "<p>Catatan rasa anggur untuk seduh manual V60.</p>",
      product_options: [SIZE_OPT],
      product_variants: [variant("s200", "v-beans", 89000)],
    };
    const qs = productFaqs(filter).map((f) => f.question);
    expect(qs).not.toContain("Kopi apa yang cocok untuk es kopi susu ekonomis?");
    expect(qs).not.toContain("Arabica atau robusta untuk menu susu?");
    expect(qs).toContain("Apakah Arabica Gayo Wine dikirim ke luar kota?");
  });

  // Live-data regression (verified against Supabase products 2026-10-28):
  // single-species products tagged "Kopi Susu Ekonomis" must NOT be called a
  // blend or get the blend-vs-single substitution question, while ES46 (whose
  // ratio only lives in the description, "40% Arabica ... 60% Fine Robusta")
  // must quote its real 40/60 ratio.
  it("single-species kopi susu products get no false blend claim", () => {
    for (const single of [
      {
        name: "Biji Kopi Full Robusta Kopi Susu Ekonomis",
        description:
          "<p>Di rekomendasikan untuk menu es kopi susu aren dengan 100% Robusta.</p>",
      },
      {
        name: "Biji Kopi Full Arabica Kopi Susu Ekonomis",
        description:
          "<p>Di rekomendasikan untuk menu es kopi susu aren dengan 100% Arabica.</p>",
      },
    ]) {
      const qs = productFaqs({ ...single, product_options: [SIZE_OPT], product_variants: [variant("s1kg", "v-beans", 150000)] }).map((f) => f.question);
      expect(qs, single.name).not.toContain("Kopi apa yang cocok untuk es kopi susu ekonomis?");
      expect(qs, single.name).not.toContain("Arabica atau robusta untuk menu susu?");
      const joined = JSON.stringify(productFaqs({ ...single, product_options: [SIZE_OPT], product_variants: [variant("s1kg", "v-beans", 150000)] }));
      expect(joined, single.name).not.toMatch(/adalah blend/i);
    }
  });

  it("ES46 description-only ratio quotes 40/60, not a generic blend", () => {
    const es46 = {
      name: "House Blend Espresso - Arabica & Fine Robusta - ES46",
      description:
        "<p>40% Arabica Wethull - (Fullcityplus Roast)<br>60% Fine Robusta Fullwash<br>Di rekomendasikan untuk menu kopi susu aren.</p>",
      product_options: [SIZE_OPT],
      product_variants: [variant("s1kg", "v-beans", 165000)],
    };
    const first = productFaqs(es46)[0];
    expect(first.question).toBe("Kopi apa yang cocok untuk es kopi susu ekonomis?");
    expect(first.answer).toContain("blend 40% Arabica dan 60% Robusta");
  });

  it("milkMenuMatch fires only when both species are offered", () => {
    expect(milkMenuMatch({ name: "Biji Kopi Blend 50/50 Kopi Susu Ekonomis", description: "50% Arabica dan 50% Robusta" }).fires).toBe(true);
    expect(milkMenuMatch({ name: "Biji Kopi Full Arabica Kopi Susu Ekonomis", description: "100% Arabica untuk kopi susu" }).fires).toBe(false);
    expect(milkMenuMatch({ name: "Biji Kopi Full Robusta Kopi Susu Ekonomis", description: "100% Robusta kopi susu" }).fires).toBe(false);
    expect(milkMenuMatch({ name: "Arabica Gayo Wine", description: "v60 manual brew" }).fires).toBe(false);
  });

  it("answers are 1-3 sentences — quotable for AI engines", () => {
    for (const faq of productFaqs(live5050)) {
      const sentences = faq.answer.split(/[.!?]\s/).filter(Boolean).length;
      expect(sentences, faq.question).toBeLessThanOrEqual(4);
    }
  });
});
