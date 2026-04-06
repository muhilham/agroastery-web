import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries/profiles";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import ProfileEditForm from "./ProfileEditForm";
import { MapPin, ShoppingBag, ChevronRight } from "lucide-react";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/account");
  }

  const profile = await getProfile(supabase, user.id);

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
        </div>
      </main>
      <Footer />
    </div>
  );
}
