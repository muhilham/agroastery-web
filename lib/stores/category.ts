import { CATEGORY } from "@/constant/category";
import { TCategory } from "@/types/categories";
import { atom } from "nanostores";

export const $categories = atom<TCategory[]>(CATEGORY);
export const $selectedCategoryId = atom<string | null>(null);
