import type { TCategory } from "@/types/categories";

export const CATEGORY: TCategory[] = [
  { category_id: "1", category_name: "Kopi Susu Ekonomis" },
  { category_id: "2", category_name: "House Blend" },
  { category_id: "3", category_name: "Full Arabica" },
  { category_id: "4", category_name: "Fine Robusta" },
  { category_id: "5", category_name: "Seduh Manual" },
  { category_id: "6", category_name: "Base Brew Espresso" },
  { category_id: "7", category_name: "Filter & Others" },
];

export const CATEGORY_BY_ID: Record<string, TCategory> = Object.fromEntries(
  CATEGORY.map((c) => [c.category_id, c]),
);
