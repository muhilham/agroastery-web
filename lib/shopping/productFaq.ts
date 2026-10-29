/**
 * Intent-first FAQ for product detail pages (issue #235).
 *
 * GA4 organic-landing data showed the 5050 PDP pulling "kopi susu ekonomis"
 * searches with the least engaging copy in the set. The old operational FAQs
 * ("bisa digiling?") answered merchant questions, not the queries users and
 * AI engines actually ask, and existed ONLY in JSON-LD — no visible FAQ on the
 * PDP, which violates Google's parity rule (lib/seo/content-jsonld.ts mirrors
 * the SAME list into both). This module builds one list from live variant
 * data; page.tsx renders it visibly and feeds the identical array to
 * faqJsonLd(), so parity holds by construction.
 */
import { parseSizeGrams } from "@/lib/seo/arabica-pricing";
import { numberToIdr } from "@/lib/numberToIdr";

export type ProductFaq = { question: string; answer: string };

const SIZE_OPTION_RE = /size|ukuran/i;
const GRIND_OPTION_RE = /giling|grind/i;

/**
 * Cheapest purchasable WHOLE-BEANS pack per size (grams), mirroring
 * lib/seo/arabica-pricing.ts: ground surcharges never skew the quoted price.
 * A size is kept when at least one variant is active AND in stock — the FAQ
 * must not advertise a price no one can actually buy today.
 */
export function purchasablePackPrices(product: {
  product_options?: { name: string; product_option_values?: { id: string; value: string }[] }[] | null;
  product_variants?: {
    price: number;
    discounted_price?: number;
    stock_quantity: number;
    is_active: boolean;
    product_variant_option_values?: { option_value_id: string }[] | null;
  }[] | null;
}): Map<number, number> {
  const valueIndex = new Map<string, { option: string; value: string }>();
  for (const option of product.product_options ?? []) {
    for (const value of option.product_option_values ?? []) {
      valueIndex.set(value.id, { option: option.name, value: value.value });
    }
  }

  const byGrams = new Map<number, { whole: number | null; min: number }>();
  for (const variant of product.product_variants ?? []) {
    if (!variant.is_active || variant.stock_quantity <= 0) continue;
    let grams: number | null = null;
    let isWholeBeans = false;
    for (const link of variant.product_variant_option_values ?? []) {
      const info = valueIndex.get(link.option_value_id);
      if (!info) continue;
      if (grams === null && SIZE_OPTION_RE.test(info.option)) {
        grams = parseSizeGrams(info.value);
      }
      if (/beans/i.test(info.value)) isWholeBeans = true;
    }
    if (grams === null) continue;
    const price = variant.discounted_price ?? variant.price;
    const current = byGrams.get(grams) ?? { whole: null, min: Infinity };
    if (isWholeBeans) {
      current.whole = current.whole === null ? price : Math.min(current.whole, price);
    }
    current.min = Math.min(current.min, price);
    byGrams.set(grams, current);
  }

  const packs = new Map<number, number>();
  for (const [grams, { whole, min }] of byGrams) {
    packs.set(grams, whole ?? min);
  }
  return packs;
}

/** Price anchor for the intent copy (issue #235): quote the REAL purchasable
 * 1 kg pack when it exists; otherwise anchor on the largest purchasable pack
 * at its actual price. Never extrapolate a per-kg rate from small packs —
 * the 100g rate x10 (Rp330rb) misrepresents the true kg price (Rp218rb). */
export type PriceAnchor =
  | { kind: "kg"; price: number }
  | { kind: "pack"; grams: number; price: number };

export function priceAnchor(packs: Map<number, number>): PriceAnchor | null {
  const kg = packs.get(1000);
  if (kg !== undefined) return { kind: "kg", price: kg };
  let best: { grams: number; price: number } | null = null;
  for (const [grams, price] of packs) {
    if (!best || grams > best.grams) best = { grams, price };
  }
  return best ? { kind: "pack", grams: best.grams, price: best.price } : null;
}

/** Compact IDR for answer copy: "Rp191.350" (no NBSP — the answers are
 * sentence text, not price-table cells). */
export function idr(nominal: number): string {
  return numberToIdr({ nominal }).replace("\u00A0", "");
}

/**
 * Milk-menu intent match, derived from the product itself (issue #235).
 * Factual-guarded: an "es kopi susu"-tagged SINGLE-species product (live
 * "Full Robusta Kopi Susu Ekonomis" = 100% Robusta, "Full Arabica Kopi Susu
 * Ekonomis" = 100% Arabica) must not be called "blend arabica dan robusta",
 * and the substitution question "Arabica atau robusta untuk menu susu?"
 * would invite LLMs to recommend a single-origin for a blend-vs-single
 * intent. Both questions therefore fire only when the product copy offers
 * BOTH species. The ratio sentence, when derivable from the name
 * ("Blend 50/50") or the description ("40% Arabica ... 60% ... Robusta"),
 * is quoted exactly so sibling blends (20/80, 70/30, ES46) stay true.
 */
export function milkMenuMatch(product: {
  name: string;
  description?: string | null;
}): { fires: boolean; ratioSentence: string | null } {
  const name = product.name.toLowerCase();
  const desc = (product.description ?? "").toLowerCase();
  const haystack = `${desc} ${name}`;
  const fires =
    /kopi susu/.test(haystack) && /arabica/.test(haystack) && /robusta/.test(haystack);
  if (!fires) return { fires: false, ratioSentence: null };
  const ratio =
    /(?:blend\s*)?(\d{1,2})\s*\/\s*(\d{1,2})/i.exec(name) ||
    /(\d{1,2})\s*%\s*arabica[\s\S]{0,80}?(\d{1,2})\s*%[^.]{0,20}robusta/i.exec(haystack);
  return {
    fires: true,
    ratioSentence: ratio
      ? `blend ${ratio[1]}% Arabica dan ${ratio[2]}% Robusta`
      : "blend arabica dan robusta",
  };
}

/** Roasted-bean products only — gates the gram-per-porsi and resting-period
 * claims. Name+description heuristic, deny-list first so a merch item whose
 * description mentions coffee (e.g. a tumbler "untuk kopi susu") never slips
 * through the allow-list. */
export function isBeansProduct(product: {
  name: string;
  description?: string | null;
}): boolean {
  const haystack = `${product.name} ${product.description ?? ""}`.toLowerCase();
  return (
    /biji kopi|whole beans|single origin|\bblend\b|arabica|robusta|sangrai|roast/.test(
      haystack
    ) &&
    !/tumbler|merch|apparel|kaos|hoodie|topping|sirup|creamer|sedotan|stainless|botol|kertas kerja|waterworks|aksesoris|dripper|kettle|grinder|gilingan mesin|mesin|1000ml/.test(
      haystack
    )
  );
}

/**
 * The single source of truth for the PDP FAQ block (visible DOM + JSON-LD).
 * Intent questions ("kopi apa yang cocok untuk es kopi susu ekonomis?") come
 * first — they are what users type and what AI engines quote — followed by
 * the operational ones (grind, packing, delivery). The milk-menu questions
 * only appear when the product is genuinely suited to milk menus AND never
 * assert a composition the product doesn't have (see milkMenuMatch).
 */
export function productFaqs(
  product: {
    name: string;
    description?: string | null;
    product_options?: { name: string; product_option_values?: { id: string; value: string }[] }[] | null;
    product_variants?: {
      price: number;
      discounted_price?: number;
      stock_quantity: number;
      is_active: boolean;
      product_variant_option_values?: { option_value_id: string }[] | null;
    }[] | null;
  },
  packs = purchasablePackPrices(product)
): ProductFaq[] {
  const faqs: ProductFaq[] = [];
  const anchor = priceAnchor(packs);

  // Intent: substitution/recommendation query for the milk-menu category.
  // milkMenuMatch guards against asserting a composition the product doesn't
  // offer (single-species "Kopi Susu Ekonomis" products exist live) and
  // derives the ratio sentence from the product itself — never hardcoded, so
  // sibling blends (20/80, 70/30, ES46 40/60) sharing this builder stay true.
  const milk = milkMenuMatch(product);
  if (milk.fires) {
    faqs.push({
      question: "Kopi apa yang cocok untuk es kopi susu ekonomis?",
      answer: `${product.name} adalah ${milk.ratioSentence} yang dirancang untuk menu es kopi susu: karakter robusta membuat rasa kopi tetap terasa setelah dicampur susu dan gula aren, sementara arabica menjaga profil tetap halus. Blend seperti ini adalah basis menu kopi susu paling umum di cafe.`,
    });
    faqs.push({
      question: "Arabica atau robusta untuk menu susu?",
      answer: "Untuk menu susu, blend arabica dan robusta biasanya lebih aman daripada single origin. Robusta menyumbang body dan kekuatan rasa yang tidak hilang di bawah susu, arabica menyumbang aroma dan kehalusan. Blend seperti ini menyeimbangkan keduanya sekaligus menjaga harga per sajian tetap ekonomis.",
    });
  }

  // Intent: price query, quoted from live purchasable packs only. When a 1 kg
  // pack is actually buyable, answer the "per kilo" query directly; otherwise
  // ask about pack price — never extrapolate a per-kg rate from small packs.
  if (anchor) {
    const packList = [...packs.keys()].sort((a, b) => a - b);
    const otherSizes = packList.filter((g) => g !== 1000);
    const otherNote = otherSizes.length
      ? ` Tersedia juga pack ${otherSizes.map((g) => (g >= 1000 ? `${g / 1000} kg` : `${g} gram`)).join(", ")}.`
      : "";
    if (anchor.kind === "kg") {
      faqs.push({
        question: `Berapa harga biji kopi ${product.name.replace(/^Biji Kopi /i, "")} per kilo?`,
        answer: `${product.name} dijual ${idr(anchor.price)}/kg untuk pack 1 kg.${otherNote} Harga per pack terlihat langsung di halaman ini.`,
      });
    } else {
      // "mulai" quotes the CHEAPEST purchasable pack, never the largest
      // pack's price — "mulai Rp120.000" on a product buyable at Rp33.000
      // is a misstated price floor, and AI engines quote it verbatim.
      const entries = [...packs.entries()];
      const cheapest = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
      const sizeLabel = (g: number) => (g >= 1000 ? `${g / 1000} kg` : `${g} gram`);
      const rangeNote =
        anchor.grams !== cheapest[0]
          ? ` Pack terbesar ${sizeLabel(anchor.grams)} ${idr(anchor.price)}.`
          : "";
      // "choose another pack size" is false advice when only one size exists.
      const compareHint =
        packs.size > 1
          ? " Pilih ukuran pack lain di halaman produk untuk bandingkan harga."
          : "";
      faqs.push({
        question: `Berapa harga ${product.name}?`,
        answer: `${product.name} dijual mulai ${idr(cheapest[1])} untuk pack ${sizeLabel(cheapest[0])}.${rangeNote}${compareHint}`,
      });
    }
  }

  // Operational (kept from the old JSON-LD-only set). The grind axis is
  // named "Varian" on the live 5050 — detect by values too, not just name.
  const grindOption = (product.product_options ?? []).find(
    (o) =>
      GRIND_OPTION_RE.test(o.name) ||
      (o.product_option_values ?? []).some((v) => GRIND_OPTION_RE.test(v.value))
  );
  if (grindOption) {
    const grinds =
      grindOption.product_option_values
        ?.map((v) => v.value)
        .filter((val) => val && GRIND_OPTION_RE.test(val)) ?? [];
    faqs.push({
      question: `Apakah ${product.name} bisa digiling sesuai metode seduh?`,
      answer: grinds.length > 0
        ? `Ya, ${product.name} tersedia dalam opsi gilingan: ${grinds.join(", ")}. Pilih gilingan sesuai metode seduh Anda saat checkout, atau ambil whole beans untuk grinding sendiri di bar.`
        : `Ya, ${product.name} dapat digiling sesuai metode seduh pilihan Anda. Pilih opsi gilingan saat checkout.`,
    });
  }

  // Gram-per-porsi is a claim ONLY true for roasted beans — the live catalog
  // (sitemap 2026-10-29) also sells merch, Waterworks additives, and liquid
  // espresso; answering "18 g per shot" for a tumbler would be fabricated.
  if (isBeansProduct(product)) {
    faqs.push({
      question: `Berapa gram per porsi ${product.name}?`,
      answer: "Untuk espresso, satu shot memakai 18 g biji kopi; untuk es kopi susu satu sajian sekitar 18-20 g. Satu kilogram beans menghasilkan ±50-55 sajian espresso.",
    });
  }

  faqs.push({
    question: `Apakah ${product.name} dikirim ke luar kota?`,
    answer: "Ya, Agroastery mengirim biji kopi ke seluruh Indonesia lewat kurir yang tersedia di checkout. Pesanan mulai diproses setelah pembayaran berhasil.",
  });

  if (isBeansProduct(product)) {
    faqs.push({
      question: `Berapa lama resting period ${product.name}?`,
      answer: "Kopi kami optimal diseduh setelah 7-14 hari post-roast. Detail tanggal sangrai tercantum pada kemasan setiap pack.",
    });
  }

  return faqs;
}
