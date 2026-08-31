"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

export default function TrackLookupPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>({ status: "idle" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState({ status: "loading" });

    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });

      if (res.status === 429) {
        setFormState({
          status: "error",
          message: "Terlalu banyak percobaan. Silakan coba lagi nanti.",
        });
        return;
      }

      if (res.status === 404) {
        setFormState({
          status: "error",
          message:
            "Pesanan tidak ditemukan. Periksa kembali nomor pesanan dan email.",
        });
        return;
      }

      if (!res.ok) {
        setFormState({
          status: "error",
          message: "Terjadi kesalahan. Silakan coba lagi nanti.",
        });
        return;
      }

      const data = (await res.json()) as { orderId: string };
      router.push(`/track/${data.orderId}`);
    } catch {
      setFormState({
        status: "error",
        message: "Terjadi kesalahan. Silakan coba lagi nanti.",
      });
    }
  };

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 tablet:px-10 desktop:px-20 flex-1 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
          <h1 className="text-xl font-bold text-primary tracking-wide text-center mb-1">
            Lacak Pesanan
          </h1>
          <p className="text-secondary text-sm text-center mb-6">
            Masukkan nomor pesanan dan email untuk melihat status pengiriman
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="orderNumber"
                className="block text-xs font-medium text-secondary mb-1.5"
              >
                Nomor Pesanan
              </label>
              <Input
                id="orderNumber"
                type="text"
                placeholder="AGR-20260831-XXXXXX"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-secondary mb-1.5"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={formState.status === "loading"}
              className="w-full"
            >
              {formState.status === "loading" ? "Memuat..." : "Lacak"}
            </Button>

            {formState.status === "error" && (
              <p className="text-red-400 text-sm text-center">
                {formState.message}
              </p>
            )}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
