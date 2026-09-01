"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { numberToIdr } from "@/lib/numberToIdr";
import { COFFEE_BLUR_DATA_URL } from "@/lib/blurDataUrl";
import type { CartItem } from "@/lib/stores/cart";

function CheckoutImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className="object-cover"
      sizes="48px"
      placeholder="blur"
      blurDataURL={COFFEE_BLUR_DATA_URL}
      onError={() => setImgSrc("/assets/placeholder.png")}
    />
  );
}

interface OrderSummaryProps {
  cartItems: CartItem[];
  cartCount: number;
}

export default function OrderSummary({ cartItems, cartCount }: OrderSummaryProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 mb-6">
      <h2 className="text-primary font-medium mb-3">Pesanan ({cartCount} item)</h2>
      <div className="space-y-3">
        {cartItems.map((item) => (
          <div key={item.variantId} className="flex gap-3 items-center">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#2a2a2a] shrink-0">
              <CheckoutImage src={item.image} alt={item.productName} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-primary text-sm font-medium line-clamp-1">{item.productName}</p>
              <p className="text-secondary text-xs">{item.variantDescription} × {item.quantity}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-primary text-sm font-semibold">
                {numberToIdr({ nominal: item.unitPrice * item.quantity })}
              </span>
              {item.originalPrice > item.unitPrice && (
                <div className="text-xs text-gray-400 line-through">
                  {numberToIdr({ nominal: item.originalPrice * item.quantity })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Link href="/cart" className="text-xs text-white/40 hover:text-white/60 mt-3 block">
        Edit keranjang
      </Link>
    </div>
  );
}
