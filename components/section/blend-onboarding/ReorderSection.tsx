"use client";

import Link from "next/link";
import { trackBlendEvent } from "@/lib/data/blend-50-50";

export function ReorderSection() {
  return (
    <section className="border-t border-white/10 py-16">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-xl font-semibold">Menikmati Blend 50:50?</h2>
        <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--secondary))]">
          Pesan langsung dari AGRoastery dan nikmati harga terbaik kami. Hemat hingga 11%
          dibanding harga marketplace.
        </p>
        <Link
          href="/product/biji-kopi-blend-5050-kopi-susu-ekonomis"
          onClick={() => trackBlendEvent("reorder_clicked")}
          className="mt-6 inline-block rounded-full bg-[hsl(var(--primary))] px-6 py-3 text-sm font-medium text-black"
        >
          Pesan Ulang Blend 50:50
        </Link>
        <div className="mt-4">
          <Link
            href="/katalog"
            className="text-sm underline underline-offset-4 text-[hsl(var(--secondary))]"
          >
            Jelajahi Kopi Lainnya
          </Link>
        </div>
      </div>
    </section>
  );
}
