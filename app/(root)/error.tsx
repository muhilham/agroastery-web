"use client";

import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 tablet:px-10 desktop:px-20 flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-xl p-6 text-center space-y-4">
          <h1 className="text-xl font-semibold text-primary">
            Terjadi Kesalahan
          </h1>
          <p className="text-secondary text-sm">
            {error.message || "Terjadi kesalahan tak terduga."}
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={reset}
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-primary text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Coba Lagi
            </button>
            <Link
              href="/katalog"
              className="block w-full py-2.5 rounded-xl text-secondary text-sm hover:text-primary transition-colors"
            >
              Kembali ke Katalog
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
