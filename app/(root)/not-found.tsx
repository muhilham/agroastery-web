"use client";

import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 tablet:px-10 desktop:px-20 flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-xl p-6 text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">404</h1>
          <p className="text-secondary text-sm">
            Halaman tidak ditemukan
          </p>
          <Link
            href="/katalog"
            className="inline-block w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-primary text-sm font-semibold hover:bg-white/10 transition-colors mt-2"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
