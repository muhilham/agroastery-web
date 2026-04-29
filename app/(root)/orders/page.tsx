import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";
import { numberToIdr } from "@/lib/numberToIdr";
import { Package } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  paid: "Dibayar",
  processing: "Diproses",
  shipped: "Dikirim",
  delivered: "Diterima",
  cancelled: "Dibatalkan",
  refunded: "Dikembalikan",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "text-yellow-400 bg-yellow-400/10",
  paid: "text-green-400 bg-green-400/10",
  processing: "text-blue-400 bg-blue-400/10",
  shipped: "text-cyan-400 bg-cyan-400/10",
  delivered: "text-green-500 bg-green-500/10",
  cancelled: "text-red-400 bg-red-400/10",
  refunded: "text-orange-400 bg-orange-400/10",
};

export default async function OrdersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/orders");
  }

  const { data: orders } = await supabase
    .from("ecom_orders")
    .select("id, order_number, status, total, created_at, subtotal, shipping_cost")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 tablet:px-10 desktop:px-20 flex-1">
        <h1 className="text-2xl font-semibold text-primary mb-8 tracking-widest uppercase">
          Riwayat Pesanan
        </h1>

        {!orders || orders.length === 0 ? (
          <div className="flex flex-col items-center gap-6 py-20 text-center">
            <Package className="w-14 h-14 text-white/20" />
            <div>
              <p className="text-primary text-base mb-2">Belum ada pesanan</p>
              <p className="text-secondary text-sm">Pesan sekarang dan lacak di sini</p>
            </div>
            <Link href="/katalog" className="text-primary underline text-sm">
              Lihat Produk
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusLabel = STATUS_LABELS[order.status] ?? order.status;
              const statusColor = STATUS_COLORS[order.status] ?? "text-white/60 bg-white/5";
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block p-4 rounded-xl bg-[#1a1a1a] border border-white/10 active:bg-[#222222] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-primary font-medium text-sm">{order.order_number}</p>
                      <p className="text-secondary text-xs mt-0.5">
                        {new Date(order.created_at as string).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-secondary text-sm">Total</span>
                    <span className="text-primary font-semibold text-sm">
                      {numberToIdr({ nominal: order.total as number })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
