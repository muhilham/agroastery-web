import { TProduct } from "@/types/product";

export const SAMPLE_PRODUCT_DETAIL: TProduct = {
  title: "Ethiopian Yirgacheffe",
  size: ["100g", "200g"],
  grind_level: ["Beans", "Grind Fine", "Grind Medium"],
  category: "Full Arabika",
  description: "A bright, floral coffee with citrus notes and a smooth finish.",
  image: [
    { image: "/assets/coffe/blend-gayo.png" },
    { image: "/assets/coffe/blend-gayo.png" }
  ],
  price: 1200,
  quantity: 50
};
