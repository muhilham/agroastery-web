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

  $checkoutDraft.set({
    slug: p.slug,
    title: p.title,
    image: p.images?.[0]?.image ?? "/assets/coffe/blend-gayo.png",
    unitPrice: p.price ?? 0,
    size: opts.size,
    grind: opts.grind,
    qty: Math.max(0, opts.qty || 0),
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
