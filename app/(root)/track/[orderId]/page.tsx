import { notFound } from "next/navigation";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { numberToIdr } from "@/lib/numberToIdr";
import { TrackingTimeline } from "./TrackingTimeline";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lacak Pesanan | Agroastery",
  description: "Lacak status pengiriman pesanan kopi Anda",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  paid: "Pembayaran Diterima",
  processing: "Sedang Diproses",
  shipped: "Dikirim",
  delivered: "Diterima",
  ready_for_pickup: "Siap Diambil",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  refunded: "Dikembalikan",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  paid: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  processing: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  shipped: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  delivered: "text-green-500 bg-green-500/10 border-green-500/20",
  ready_for_pickup: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  completed: "text-green-500 bg-green-500/10 border-green-500/20",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  refunded: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

type PageProps = { params: Promise<{ orderId: string }> };

export default async function TrackingPage({ params }: PageProps) {
  const { orderId } = await params;
  const admin = createSupabaseAdminClient();

  const { data: order } = await admin
    .from("ecom_orders")
    .select("*, ecom_order_items(*)")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  const statusLabel = STATUS_LABELS[order.status as string] ?? order.status;
  const statusColor =
    STATUS_COLORS[order.status as string] ?? "text-white/60 bg-white/5 border-white/10";
  const shippingAddress = order.shipping_address as Record<string, string> | null;
  const items = (order.ecom_order_items as Array<{
    id: string;
    product_name: string;
    variant_description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>) ?? [];

  const orderDate = new Date(order.created_at as string).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 tablet:px-10 desktop:px-20 flex-1">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-primary tracking-wide truncate">
              {order.order_number as string}
            </h1>
            <p className="text-secondary text-sm mt-0.5">{orderDate}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0 whitespace-nowrap ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Shipping + live Biteship timeline */}
        {order.shipping_courier === "pickup" ? (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-3">
              Ambil Sendiri
            </h2>
            <p className="text-primary text-sm">{shippingAddress?.address_line}</p>
            {shippingAddress?.hours && (
              <p className="text-secondary text-sm mt-1">{shippingAddress.hours}</p>
            )}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-3">
              Info Pengiriman
            </h2>
            {shippingAddress && (
              <div className="space-y-1.5 mb-4">
                {order.shipping_courier && (
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Kurir</span>
                    <span className="text-primary font-medium">
                      {(order.shipping_courier as string).toUpperCase()}{" "}
                      {order.shipping_service as string}
                    </span>
                  </div>
                )}
                {order.shipping_etd && (
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Estimasi tiba</span>
                    <span className="text-primary">{order.shipping_etd as string}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Tujuan</span>
                  <span className="text-primary text-right max-w-[200px] leading-snug">
                    {shippingAddress.address_line}
                    {shippingAddress.postal_code ? ` ${shippingAddress.postal_code}` : ""}
                  </span>
                </div>
              </div>
            )}
            <TrackingTimeline orderId={orderId} />
          </div>
        )}

        {/* Items */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-3">
            Produk
          </h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-primary text-sm font-medium line-clamp-1">
                    {item.product_name}
                  </p>
                  <p className="text-secondary text-xs">
                    {item.variant_description} × {item.quantity}
                  </p>
                </div>
                <span className="text-primary text-sm font-semibold shrink-0">
                  {numberToIdr({ nominal: item.subtotal })}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-3 mt-3 border-t border-white/10">
            <span className="text-secondary text-sm">Total</span>
            <span className="text-primary text-sm font-bold">
              {numberToIdr({ nominal: order.total as number })}
            </span>
          </div>
        </div>

        {/* Account conversion — only shown for unlinked guest orders */}
        {!order.user_id && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-center">
            <p className="text-primary text-sm font-semibold mb-1">
              Simpan pesanan ke akun
            </p>
            <p className="text-secondary text-xs mb-4 leading-relaxed">
              Masuk untuk melihat semua riwayat pesanan kamu di satu tempat
            </p>
            <Link
              href={`/login?next=/track/${orderId}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-primary text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Lanjut dengan Google
            </Link>
            <Link href="/katalog" className="text-secondary/40 text-xs mt-3 underline block">
              Lewati
            </Link>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
