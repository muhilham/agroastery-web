import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAddresses } from "@/lib/supabase/queries/addresses";
import type { Address } from "@/lib/supabase/queries/addresses";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import AddressCard from "./AddressCard";
import { Plus, ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alamat Saya | Agroastery",
  description: "Kelola alamat pengiriman Anda",
};

export default async function AddressesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/account/addresses");
  }

  let addresses: Address[] = [];
  let fetchError: string | null = null;
  try {
    addresses = await getAddresses(supabase, user.id);
  } catch {
    fetchError = "Gagal memuat alamat. Silakan coba lagi.";
  }

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex-1">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/account" className="text-primary/60 hover:text-primary">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold text-primary">Saved Addresses</h1>
          </div>

          {fetchError ? (
            <p className="text-sm text-destructive text-center py-12">{fetchError}</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-white/60 text-center py-12">
              No saved addresses yet.
            </p>
          ) : (
            <div className="space-y-3 mb-6">
              {addresses.map((address) => (
                <AddressCard key={address.id} address={address} />
              ))}
            </div>
          )}

          <Link
            href="/account/addresses/new"
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 px-4 py-3 text-sm text-primary hover:bg-primary/10 mt-4"
          >
            <Plus className="w-4 h-4" />
            Add New Address
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
