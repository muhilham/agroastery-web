import type { TProduct, TProductBase } from "@/types/product";
import { CATEGORY_BY_ID } from "../category";

export const slugify = (slug: string) =>
  slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const RAW_PRODUCTS: TProductBase[] = [
  {
    title: "BLEND KOPI SUSU EKONOMIS",
    description: "Arabica semi-washed dari 1600 mdpl, ideal",
    grindSize: ["Beans", "Grind Fine", "Grind Medium"],
    size: ["100g", "200g"],
    coffeType: ["Arabika", "Robusta"],
    category_ids: ["1"],
    priceBySize: { "100g": 12000, "200g": 230000 },
    price: 12000,
    images: [
      { image: "/assets/coffe/blend-gayo.png" },
      { image: "/assets/coffe/blend-gayo.png" },
    ],
  },
  {
    title: "Biji Kopi STANDARD GAYO Full Arabica",
    description: "Arabica semi-washed dari 1600 mdpl, ideal",
    grindSize: ["Beans", "Grind Fine", "Grind Medium"],
    size: ["100g", "200g"],
    coffeType: ["Arabika", "Robusta"],
    category_ids: ["2"],
    priceBySize: { "100g": 120000, "200g": 230000 },
    price: 120000,

    images: [
      { image: "/assets/coffe/blend-gayo.png" },
      { image: "/assets/coffe/blend-gayo.png" },
    ],
  },
  {
    title: "ANJAY KOPI",
    description: "Arabica semi-washed dari 1600 mdpl, ideal",
    grindSize: ["Beans", "Grind Fine", "Grind Medium"],
    size: ["100g", "200g"],
    coffeType: ["Arabika", "Robusta"],
    category_ids: ["2"],
    priceBySize: { "100g": 120000, "200g": 230000 },
    price: 120000,

    images: [
      { image: "/assets/coffe/blend-gayo.png" },
      { image: "/assets/coffe/blend-gayo.png" },
    ],
  },
  {
    title: "RILL KAH BANG",
    description: "Arabica semi-washed dari 1600 mdpl, ideal",
    grindSize: ["Beans", "Grind Fine", "Grind Medium"],
    size: ["100g", "200g"],
    coffeType: ["Arabika", "Robusta"],
    category_ids: ["3"],
    priceBySize: { "100g": 120000, "200g": 230000 },
    price: 120000,

    images: [
      { image: "/assets/coffe/blend-gayo.png" },
      { image: "/assets/coffe/blend-gayo.png" },
    ],
  },
];

const derivePriceBySize = (p: TProductBase): Record<string, number> => {
  if (p.priceBySize && Object.keys(p.priceBySize).length) return p.priceBySize;

  const basePer100g = typeof p.price === "number" ? p.price : 0;
  const bySize: Record<string, number> = {};

  for (const sz of p.size ?? []) {
    const m = sz.match(/^(\d+)\s*g$/i);
    const grams = m ? parseInt(m[1], 10) : null;
    bySize[sz] = grams ? Math.round((grams / 100) * basePer100g) : basePer100g;
  }
  return bySize;
};

const minOf = (obj: Record<string, number>) =>
  Math.min(
    ...Object.values(obj).filter(
      (v) => typeof v === "number" && !Number.isNaN(v),
    ),
  );

export const PRODUCT_LIST: TProduct[] = RAW_PRODUCTS.map((p) => {
  const priceBySize = derivePriceBySize(p);
  const minPrice = minOf(priceBySize);

  return {
    ...p,
    slug: slugify(p.title),
    category: p.category_ids.map((id) => CATEGORY_BY_ID[id]).filter(Boolean),
    priceBySize,
    minPrice,
    price: minPrice,
  };
});
