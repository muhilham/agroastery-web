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
 * The single source of truth for the PDP FAQ block (visible DOM + JSON-LD).
 * Intent questions ("kopi apa yang cocok untuk es kopi susu ekonomis?") come
 * first — they are what users type and what AI engines quote — followed by
 * the operational ones (grind, packing, delivery). The milk-menu questions
 * only appear when name/description contain "kopi susu" (verified against the
 * live 5050 product).
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
  const haystack = `${(product.description ?? "").toLowerCase()} ${product.name.toLowerCase()}`;
  const isMilkDrink = /kopi susu/.test(haystack);
  const anchor = priceAnchor(packs);

  // Intent: substitution/recommendation query for the milk-menu category.
  // The ratio sentence is derived from the product itself ("Blend 50/50" or
  // "50% Arabica dan 50% Robusta" in name/description) — never hardcoded, so
  // sibling blends (20/80, 70/30) sharing this builder stay factually true.
  const ratioMatch =
    /(?:blend\s*)?(\d{1,2})\s*\/\s*(\d{1,2})/i.exec(product.name) ||
    /(\d{1,2})%\s*arabica\s*(?:dan|and)?\s*(\d{1,2})%\s*robusta/i.exec(haystack);
  if (isMilkDrink) {
    const ratioSentence = ratioMatch
      ? `blend ${ratioMatch[1]}% Arabica dan ${ratioMatch[2]}% Robusta`
      : "blend arabica dan robusta";
    faqs.push({
      question: "Kopi apa yang cocok untuk es kopi susu ekonomis?",
      answer: `${product.name} adalah ${ratioSentence} yang dirancang untuk menu es kopi susu: karakter robusta membuat rasa kopi tetap terasa setelah dicampur susu dan gula aren, sementara arabica menjaga profil tetap halus. Blend seperti ini adalah basis menu kopi susu paling umum di cafe.`,
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
      faqs.push({
        question: `Berapa harga ${product.name}?`,
        answer: `${product.name} dijual mulai ${idr(anchor.price)} untuk pack terbesar yang tersedia (${anchor.grams >= 1000 ? `${anchor.grams / 1000} kg` : `${anchor.grams} gram`}). Pilih ukuran pack lain di halaman produk untuk bandingkan harga.`,
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

  faqs.push({
    question: `Berapa gram per porsi ${product.name}?`,
    answer: "Untuk espresso, satu shot memakai 18 g biji kopi; untuk es kopi susu satu sajian sekitar 18-20 g. Satu kilogram beans menghasilkan ±50-55 sajian espresso.",
  });

  faqs.push({
    question: `Apakah ${product.name} dikirim ke luar kota?`,
    answer: "Ya, Agroastery mengirim biji kopi ke seluruh Indonesia lewat kurir yang tersedia di checkout. Pesanan mulai diproses setelah pembayaran berhasil.",
  });

  faqs.push({
    question: `Berapa lama resting period ${product.name}?`,
    answer: "Kopi kami optimal diseduh setelah 7-14 hari post-roast. Detail tanggal sangrai tercantum pada kemasan setiap pack.",
  });

  return faqs;
}
