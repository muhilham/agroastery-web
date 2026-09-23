import type { ArabicaPriceRow } from "./arabica-pricing";

/**
 * Fallback rows for /harga-biji-kopi-arabica when Supabase is unreachable.
 * Verified snapshot of the live catalog on 2026-09-23 — NOT invented prices.
 * Keeps the price-intent page indexable during transient DB errors; the page
 * labels this state visibly.
 */
export const STATIC_ARABICA_ROWS: ArabicaPriceRow[] = [
  {
    name: "Biji Kopi Full Arabica Kopi Susu Ekonomis 1 Kg",
    slug: "biji-kopi-full-arabica-kopi-susu-ekonomis-1-kg-1kg",
    packs: [
      { grams: 100, price: 36000 },
      { grams: 200, price: 60000 },
      { grams: 500, price: 131000 },
      { grams: 1000, price: 237000 },
    ],
    bestPack: { grams: 1000, price: 237000 },
    bestPerKg: 237000,
  },
  {
    name: "Biji Kopi Standard Gayo Full Arabica",
    slug: "biji-kopi-standard-gayo-full-arabica",
    packs: [
      { grams: 100, price: 59000 },
      { grams: 200, price: 97000 },
      { grams: 500, price: 214000 },
      { grams: 1000, price: 388000 },
    ],
    bestPack: { grams: 1000, price: 388000 },
    bestPerKg: 388000,
  },
  {
    name: "Biji Kopi Standard Kintamani Full Arabica",
    slug: "biji-kopi-standard-kintamani-full-arabica",
    packs: [
      { grams: 100, price: 59000 },
      { grams: 200, price: 98000 },
      { grams: 500, price: 214000 },
      { grams: 1000, price: 389000 },
    ],
    bestPack: { grams: 1000, price: 389000 },
    bestPerKg: 389000,
  },
  {
    name: "Biji Kopi Standard Solok Selatan Full Arabica",
    slug: "biji-kopi-standard-solok-selatan-full-arabica",
    packs: [
      { grams: 100, price: 62000 },
      { grams: 200, price: 103000 },
      { grams: 500, price: 227000 },
      { grams: 1000, price: 412000 },
    ],
    bestPack: { grams: 1000, price: 412000 },
    bestPerKg: 412000,
  },
  {
    name: "Biji Kopi Standard Brazil Cerrado Full Arabica",
    slug: "biji-kopi-standard-brazil-cerrado-full-arabica",
    packs: [
      { grams: 100, price: 64000 },
      { grams: 200, price: 106000 },
      { grams: 500, price: 232000 },
      { grams: 1000, price: 421000 },
    ],
    bestPack: { grams: 1000, price: 421000 },
    bestPerKg: 421000,
  },
];
