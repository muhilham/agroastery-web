// app/(root)/account/addresses/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import AddressForm, { type AddressFormValues } from "@/components/section/address-form";
import { ChevronLeft } from "lucide-react";

export default function NewAddressPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: AddressFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: data.label || undefined,
          recipient_name: data.recipient_name,
          phone: data.phone,
          address_line: data.address_line,
          postal_code: data.postal_code || undefined,
          latitude: data.lat ?? null,
          longitude: data.lng ?? null,
        }),
      });
      if (res.ok) {
        router.push("/account/addresses");
      } else {
        const json = await res.json();
        setError(json.error ?? "Terjadi kesalahan");
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex-1">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/account/addresses"
              className="text-primary/60 hover:text-primary"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold text-primary">Add Address</h1>
          </div>

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          <AddressForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitLabel="Save Address"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
