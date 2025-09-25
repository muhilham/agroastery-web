import { atom } from "nanostores";
import { PRODUCT_LIST } from "@/constant/product/product-list";

export type TCheckoutDraft = {
  slug: string;
  title: string;
  image: string;
  unitPrice: number;
  size: string;
  grind: string;
  qty: number;
  shipWeightGrams: number;
};

export const $checkoutDraft = atom<TCheckoutDraft | null>(null);

export function setCheckoutFromProduct(opts: {
  slug: string;
  size: string;
  grind: string;
  qty: number;
}) {
  const p = PRODUCT_LIST.find((x) => x.slug === opts.slug);
  if (!p) return;

  const selectedVariant = p.variants.find(v => v.weight === opts.size);
  if (!selectedVariant) return;

  $checkoutDraft.set({
    slug: p.slug,
    title: p.title,
    image: p.images?.[0]?.image ?? "/assets/coffe/blend-gayo.png",
    unitPrice: selectedVariant.price,
    size: opts.size,
    grind: opts.grind,
    qty: Math.max(0, opts.qty || 0),
    shipWeightGrams: selectedVariant.shipWeightGrams,
  });
}

export function updateCheckoutQty(qty: number) {
  const cur = $checkoutDraft.get();
  if (!cur) return;
  $checkoutDraft.set({ ...cur, qty: Math.max(0, qty) });
}

export function clearCheckout() {
  $checkoutDraft.set(null);
}

// Selectors for shipping calculator
export const getCheckoutSnapshot = () => $checkoutDraft.get();
export const getSelectedWeightGrams = () => $checkoutDraft.get()?.shipWeightGrams ?? null;
