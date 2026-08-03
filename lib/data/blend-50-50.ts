// lib/data/blend-50-50.ts
import { trackEvent } from "@/lib/analytics/gtag";

export const PRODUCT_SLUG = "blend-50-50";
export const CONTENT_VERSION = "2026-08"; // bump whenever recipe dose/yield/time copy changes

export type BrewMethod = "espresso" | "iced_americano" | "es_kopi_susu";

export type Recipe = {
  id: BrewMethod;
  title: string;
  steps: { label: string; value: string }[];
  tasteProfile: string[];
  note?: string;
};

export type Ingredient = {
  name: string;
  detail: string;
};

export type Troubleshooting = {
  question: string;
  answer: string;
};

export function trackBlendEvent(eventName: string, params?: Record<string, unknown>): void {
  trackEvent(eventName, { ...params, product: PRODUCT_SLUG, version: CONTENT_VERSION });
}

export const recipes: Recipe[] = [
  {
    id: "espresso",
    title: "Espresso",
    steps: [
      { label: "Dose", value: "18g" },
      { label: "Yield", value: "40g" },
      { label: "Waktu", value: "26–29 detik" },
    ],
    tasteProfile: ["Chocolate", "Earthy", "Orange Peel", "Bold"],
    note: "Resep ini adalah titik awal yang kami rekomendasikan. Penyesuaian kecil mungkin diperlukan tergantung grinder dan mesin espresso Anda.",
  },
  {
    id: "iced_americano",
    title: "Iced Americano",
    steps: [
      { label: "Espresso", value: "1 shot" },
      { label: "Air (suhu ruang)", value: "100g" },
      { label: "Es", value: "70g" },
    ],
    tasteProfile: ["Nutty", "Chocolate", "Orange Peel", "Starch-like oat"],
  },
  {
    id: "es_kopi_susu",
    title: "Es Kopi Susu",
    steps: [
      { label: "Liquid Creamer", value: "30g" },
      { label: "Espresso", value: "1 shot" },
      { label: "Liquid Aren Mahorahora", value: "10g" },
      { label: "Diamond Full Cream UHT", value: "80g" },
      { label: "Es", value: "150g" },
    ],
    tasteProfile: ["Chocolate Cookie", "Creamy", "Sweet Aren", "Starch-like oat"],
  },
];

export const ingredients: Ingredient[] = [
  { name: "Air", detail: "Aqua" },
  { name: "Susu", detail: "Diamond Full Cream UHT" },
  { name: "Sirup Aren", detail: "Mahorahora" },
  {
    name: "Liquid Creamer",
    detail: "Campur 50g bubuk creamer + 50g Aqua, blender hingga halus.",
  },
];

export const troubleshooting: Troubleshooting[] = [
  { question: "Kopi terasa terlalu asam", answer: "Coba giling lebih halus." },
  { question: "Kopi terasa pahit", answer: "Giling lebih kasar." },
  {
    question: "Rasa kopi hilang setelah ditambah susu",
    answer: "Tingkatkan kekuatan ekstraksi atau kurangi susu.",
  },
  { question: "Aliran terlalu cepat", answer: "Giling lebih halus." },
];
