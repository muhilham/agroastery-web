import { z } from "zod";

export const CategorySchema = z.object({
  category_id: z.string().min(1),
  category_name: z.string().min(1),
});
export const CategoriesSchema = z.array(CategorySchema);

export const VariantSchema = z.object({
  weight: z.string().min(1),
  price: z.number().int().nonnegative(),
  sku: z.string().min(1).optional(),
  quantity: z.number().int().nonnegative().optional(),
  shipWeightGrams: z.number().int().positive().optional(), // Optional for fallback
});

export const ProductSchema = z.object({
  title: z.string(),
  description: z.string(),
  grindSize: z.array(z.string()),
  coffeType: z.array(z.string()),
  category_ids: z.array(z.string()),
  images: z.array(z.object({ image: z.string() })),
  shortDescription: z.string().optional(),
  variants: z.array(VariantSchema),
});

export const ProductsSchema = z.array(ProductSchema);
