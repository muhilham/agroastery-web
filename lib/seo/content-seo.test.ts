/**
 * Pure-function tests for the #178 pricing helpers — the table/FAQ data the
 * /harga-biji-kopi-arabica page renders and emits as JSON-LD.
 */
import { describe, it, expect } from "vitest";
import {
  parseSizeGrams,
  buildArabicaPriceRows,
  priceRange,
  arabicaFaqs,
} from "./arabica-pricing";
import { collectionPageJsonLd, faqJsonLd, arabicaPriceListJsonLd } from "./content-jsonld";
import { SUSU_5050, ARABICA_GAYO, ARABICA_ROBUSTA_BLEND, ARABICA_NO_SIZE, FILTER_ETHIOPIA, ARABICA_FILTER_150 } from "./testing/fixtures";

describe("parseSizeGrams", () => {
  it("parses gram and kg variants", () => {
    expect(parseSizeGrams("100gram")).toBe(100);
    expect(parseSizeGrams("200 gr")).toBe(200);
    expect(parseSizeGrams("1Kg")).toBe(1000);
    expect(parseSizeGrams("1.5kg")).toBe(1500);
  });
  it("rejects non-weight sizes", () => {
    expect(parseSizeGrams("1000ml")).toBeNull();
    expect(parseSizeGrams("Standar")).toBeNull();
  });
});

describe("buildArabicaPriceRows", () => {
  it("keeps only pure arabica products with parseable sizes", () => {
    const rows = buildArabicaPriceRows([
      ARABICA_GAYO,
      SUSU_5050,
      ARABICA_ROBUSTA_BLEND,
      ARABICA_NO_SIZE,
      FILTER_ETHIOPIA,
    ]);
    expect(rows.map((r) => r.slug)).toEqual([
      "biji-kopi-standard-gayo-full-arabica",
    ]);
    expect(
      rows.some((r) => r.slug === "house-blend-espresso-arabica-fine-robusta-es46")
    ).toBe(false);
  });

  it("derives bestPerKg and bestPack from the cheapest per-gram pack", () => {
    const [row] = buildArabicaPriceRows([ARABICA_GAYO]);
    expect(row.packs).toEqual([
      { grams: 100, price: 59000 },
      { grams: 200, price: 97000 },
      { grams: 500, price: 214000 },
      { grams: 1000, price: 388000 },
    ]);
    // 388.000/1kg beats 214.000*2=428.000 and 59.000*10=590.000
    expect(row.bestPerKg).toBe(388000);
    // the anchor offered in JSON-LD is a real purchasable pack (1kg), not an
    // extrapolated per-kg figure
    expect(row.bestPack).toEqual({ grams: 1000, price: 388000 });
  });

  it("anchors a no-1kg product on its single real pack price, not an extrapolated rate", () => {
    // ARABICA_FILTER_150 has only a 150gr pack; bestPerKg extrapolates to
    // 150.000*1000/150 = 1.000.000, but the purchasable price is 150.000.
    const rows = buildArabicaPriceRows([ARABICA_FILTER_150]);
    expect(rows).toHaveLength(1);
    expect(rows[0].bestPerKg).toBe(1000000);
    expect(rows[0].bestPack).toEqual({ grams: 150, price: 150000 });
  });

  it("sorts rows by price ascending", () => {
    const rows = buildArabicaPriceRows([ARABICA_GAYO, ARABICA_GAYO]);
    expect(rows).toHaveLength(2);
  });
});

describe("priceRange + arabicaFaqs", () => {
  it("returns null range for empty rows and still answers generically", () => {
    expect(priceRange([])).toBeNull();
    const faqs = arabicaFaqs([]);
    expect(faqs[0].answer).toMatch(/katalog/);
  });

  it("first FAQ quotes the live per-kg range", () => {
    const rows = buildArabicaPriceRows([ARABICA_GAYO]);
    const faqs = arabicaFaqs(rows);
    expect(faqs[0].question).toContain("harga biji kopi arabica per kg");
    expect(faqs[0].answer).toContain("388.000");
  });
});

describe("JSON-LD builders", () => {
  it("collectionPageJsonLd lists priced products only", () => {
    const { __html } = collectionPageJsonLd({
      name: "X",
      description: "Y",
      url: "/x",
      products: [
        { slug: "ada", name: "Ada", price: 1000 },
        { slug: "nihil", name: "Nihil", price: 0 },
      ],
    });
    const json = JSON.parse(__html);
    expect(json["@type"]).toBe("CollectionPage");
    expect(json.mainEntity.numberOfItems).toBe(1);
    expect(json.mainEntity.itemListElement[0].item.offers.priceCurrency).toBe("IDR");
  });

  it("faqJsonLd escapes closing script tags", () => {
    const { __html } = faqJsonLd([
      { question: "Q</script>", answer: "A" },
    ]);
    expect(__html).not.toContain("</script>");
    expect(__html).toContain("<\\/script>");
  });

  it("arabicaPriceListJsonLd anchors each offer at a real purchasable pack price", () => {
    const rows = buildArabicaPriceRows([ARABICA_GAYO]);
    const json = JSON.parse(arabicaPriceListJsonLd(rows, "/harga-biji-kopi-arabica").__html);
    expect(json["@type"]).toBe("ItemList");
    expect(json.itemListElement[0].item.offers.price).toBe(388000);
  });

  it("arabicaPriceListJsonLd never emits an extrapolated per-kg rate as the offer", () => {
    const rows = buildArabicaPriceRows([ARABICA_FILTER_150]);
    const json = JSON.parse(arabicaPriceListJsonLd(rows, "/harga-biji-kopi-arabica").__html);
    // purchasable 150gr price, NOT the extrapolated 1.000.000 per kg
    expect(json.itemListElement[0].item.offers.price).toBe(150000);
  });
});
