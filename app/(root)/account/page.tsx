import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries/profiles";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import ProfileEditForm from "./ProfileEditForm";
import { MapPin, ShoppingBag, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Akun Saya | Agroastery",
  description: "Kelola profil, alamat, dan pesanan Anda",
  robots: { index: false },
  alternates: { canonical: "/account" },
};

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/account");
  }

  const profile = await getProfile(supabase, user.id);

  const todayWib = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const admin = createSupabaseAdminClient();
  const { data: consultations } = await admin
    .from("consultation_bookings")
    .select("id, booking_date, time_slot, status, manage_token")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .gte("booking_date", todayWib)
    .order("booking_date", { ascending: true });

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex-1">
        <div className="max-w-xl mx-auto">
          <h1 className="text-xl font-semibold text-primary mb-2">Account</h1>
          <p className="text-sm text-white/60 mb-8">{user.email}</p>

          <section className="mb-8">
            <h2 className="text-base font-medium text-primary mb-4">Profile</h2>
            <ProfileEditForm
              initialValues={{
                full_name: profile?.full_name ?? null,
                phone: profile?.phone ?? null,
              }}
            />
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-primary mb-4">Links</h2>
            <Link
              href="/account/addresses"
              className="flex items-center justify-between rounded-xl border border-primary/30 px-4 py-3 text-sm text-primary hover:bg-primary/10"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Saved Addresses
              </span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/orders"
              className="flex items-center justify-between rounded-xl border border-primary/30 px-4 py-3 text-sm text-primary hover:bg-primary/10"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Order History
              </span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </section>

          {consultations && consultations.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-primary mb-3">Konsultasi Mendatang</h2>
              <ul className="space-y-3">
                {consultations.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-lg border border-white/15 p-3">
                    <span className="text-sm text-foreground">
                      {c.booking_date} — {c.time_slot} WIB
                    </span>
                    <Link
                      href={`/konsultasi/manage/${c.manage_token}`}
                      className="text-sm text-primary underline underline-offset-4"
                    >
                      Kelola
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
