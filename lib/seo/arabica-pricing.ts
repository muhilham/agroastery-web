/**
 * Pure pricing helpers for /harga-biji-kopi-arabica (issue #178).
 *
 * Derives per-pack and effective per-kg prices from real product variants:
 * the variant's Size option value ("100gram" ... "1Kg") carries the net
 * coffee weight; ship_weight_grams includes packaging and is NOT used.
 * Whole Beans is preferred as the reference price within a size so grind
 * surcharges never skew the table.
 */
import type { SupabaseProduct } from "@/types/product";
import { numberToIdr } from "@/lib/numberToIdr";

export type PackPrice = { grams: number; price: number };

export type ArabicaPriceRow = {
  name: string;
  slug: string;
  packs: PackPrice[];
  /** Lowest effective price per kilogram across available packs. */
  bestPerKg: number;
};

const SIZE_OPTION_RE = /size|ukuran/i;

export function parseSizeGrams(value: string): number | null {
  const match = /^\s*(\d+(?:[.,]\d+)?)\s*(gram|gr|kg)\s*$/i.exec(value);
  if (!match) return null;
  const amount = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return match[2].toLowerCase() === "kg" ? amount * 1000 : amount;
}

export function isArabicaProduct(product: SupabaseProduct): boolean {
  return /arabica/i.test(product.name);
}

/**
 * grams -> cheapest active variant price for that pack size (discount applied).
 * Whole Beans variants win over ground surcharges when both exist per size.
 */
export function packPricesForProduct(
  product: SupabaseProduct
): Map<number, number> {
  const valueIndex = new Map<string, { option: string; value: string }>();
  for (const option of product.product_options ?? []) {
    for (const value of option.product_option_values ?? []) {
      valueIndex.set(value.id, { option: option.name, value: value.value });
    }
  }

  // grams -> { wholeBeansPrice, minPrice }
  const byGrams = new Map<number, { whole: number | null; min: number }>();
  for (const variant of product.product_variants ?? []) {
    if (!variant.is_active) continue;
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
  for (const [grams, entry] of byGrams) {
    const price = entry.whole ?? entry.min;
    if (Number.isFinite(price)) packs.set(grams, price);
  }
  return packs;
}

export function buildArabicaPriceRows(
  products: SupabaseProduct[],
): ArabicaPriceRow[] {
  const rows: ArabicaPriceRow[] = [];

  for (const product of products) {
    if (!isArabicaProduct(product)) continue;

    const packs = [...packPricesForProduct(product).entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([grams, price]) => ({ grams, price }));
    if (packs.length === 0) continue;

    const perKg = packs.map((pack) => (pack.price * 1000) / pack.grams);
    rows.push({
      name: product.name,
      slug: product.slug,
      packs,
      bestPerKg: Math.round(Math.min(...perKg)),
    });
  }

  return rows.sort((a, b) => a.bestPerKg - b.bestPerKg);
}

export function priceRange(rows: ArabicaPriceRow[]): {
  minPerKg: number;
  maxPerKg: number;
} | null {
  if (rows.length === 0) return null;
  const values = rows.map((row) => row.bestPerKg);
  return { minPerKg: Math.min(...values), maxPerKg: Math.max(...values) };
}

export type Faq = { question: string; answer: string };

/**
 * FAQ answers shown on the page AND emitted as FAQPage JSON-LD — Google
 * requires the structured data to match visible content, so both render
 * from this single source.
 */
export function arabicaFaqs(rows: ArabicaPriceRow[]): Faq[] {
  const range = priceRange(rows);
  const cheapest = rows[0];
  const rupiah = (n: number) => numberToIdr({ nominal: n });

  const priceAnswer = range
    ? `Harga efektif biji kopi arabica di Agroastery saat ini mulai ${rupiah(range.minPerKg)} hingga ${rupiah(range.maxPerKg)} per kg, tergantung varian dan ukuran kemasan. Harga terbaik muncul di pack 1 kg — tabel di atas dihitung langsung dari harga katalog yang berlaku hari ini.`
    : `Harga mengikuti katalog di halaman ini; cek tabel untuk varian yang tersedia hari ini.`;

  return [
    {
      question: "Berapa harga biji kopi arabica per kg?",
      answer: priceAnswer,
    },
    {
      question: "Kenapa beli pack 1 kg lebih murah per ons-nya?",
      answer:
        "Harga per gram turun seiring ukuran kemasan: biaya pengemasan dan penanganan per unit lebih efisien di pack besar. Karena itu pack 1 kg selalu jadi harga per kg terbaik — dan jadi ukuran paling masuk akal untuk cafe yang memakai biji kopi beberapa kilo per minggu.",
    },
    {
      question: "Ini biji kopi sangrai (roasted beans) atau green bean?",
      answer:
        "Semua produk di tabel adalah biji kopi arabica yang sudah disangrai di roastery kami di Jakarta Selatan, siap seduh atau siap dipakai untuk menu cafe. Bisa minta digiling (fine, medium, coarse) atau tetap whole beans saat checkout.",
    },
    {
      question: "Apakah harga di halaman ini termasuk ongkir?",
      answer:
        "Belum. Harga yang tampil adalah harga biji kopi per kemasan di roastery. Ongkir dihitung otomatis di halaman checkout berdasarkan alamat tujuan dan berat paket, dengan kurir nasional yang kami kirim dari Jakarta Selatan.",
    },
    {
      question: "Bagaimana kalau cafe saya butuh pasokan rutin?",
      answer:
        "Ambil sesi konsultasi di halaman /konsultasi — 2 jam di roastery, termasuk diskusi menu, cicip beberapa arabica single origin, dan penawaran harga wholesale untuk pembelian rutin. Kami juga bisa meracik blend dengan profil rasa yang cafe kamu minta lewat sesi tersebut.",
    },
  ];
}
