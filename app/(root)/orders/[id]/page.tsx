import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";
import { numberToIdr } from "@/lib/numberToIdr";
import { ArrowLeft } from "lucide-react";

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

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/orders");
  }

  // Fetch order (RLS ensures user can only see their own orders)
  const { data: order } = await supabase
    .from("ecom_orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!order) {
    notFound();
  }

  // Fetch order items (RLS ensures user can only see items of their own orders)
  const { data: items } = await supabase
    .from("ecom_order_items")
    .select("*")
    .eq("order_id", id);

  const statusLabel = STATUS_LABELS[order.status as string] ?? order.status;
  const statusColor = STATUS_COLORS[order.status as string] ?? "text-white/60 bg-white/5";
  const shippingAddress = order.shipping_address as Record<string, string> | null;

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 tablet:px-10 desktop:px-20 flex-1">
        {/* Back link */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-secondary hover:text-primary text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Riwayat Pesanan
        </Link>

        <div className="flex items-start justify-between gap-2 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-primary truncate">
              {order.order_number as string}
            </h1>
            <p className="text-secondary text-sm mt-0.5">
              {new Date(order.created_at as string).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Items */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
          <h2 className="text-primary font-medium mb-3">Produk</h2>
          <div className="space-y-3">
            {(items ?? []).map((item) => (
              <div key={item.id as string} className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-primary text-sm font-medium line-clamp-1">
                    {item.product_name as string}
                  </p>
                  <p className="text-secondary text-xs">
                    {item.variant_description as string} × {item.quantity as number}
                  </p>
                </div>
                <span className="text-primary text-sm font-medium shrink-0">
                  {numberToIdr({ nominal: item.subtotal as number })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping address */}
        {shippingAddress && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
            <h2 className="text-primary font-medium mb-2">Alamat Pengiriman</h2>
            <p className="text-secondary text-sm">{shippingAddress.recipient_name}</p>
            <p className="text-secondary text-sm">{shippingAddress.phone}</p>
            <p className="text-secondary text-sm">{shippingAddress.address_line}</p>
            {shippingAddress.postal_code && (
              <p className="text-secondary text-sm">{shippingAddress.postal_code}</p>
            )}
          </div>
        )}

        {/* Shipping details */}
        {(order.shipping_courier || order.tracking_number) && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
            <h2 className="text-primary font-medium mb-2">Info Pengiriman</h2>
            {order.shipping_courier && (
              <p className="text-secondary text-sm">
                Kurir: <span className="text-primary">{order.shipping_courier as string} {order.shipping_service as string}</span>
              </p>
            )}
            {order.shipping_etd && (
              <p className="text-secondary text-sm">
                Estimasi: <span className="text-primary">{order.shipping_etd as string}</span>
              </p>
            )}
            {order.tracking_number && (
              <p className="text-secondary text-sm">
                No. Resi: <span className="text-primary font-mono break-all">{order.tracking_number as string}</span>
              </p>
            )}
          </div>
        )}

        {/* Totals */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
          <h2 className="text-primary font-medium mb-3">Ringkasan Pembayaran</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Subtotal</span>
              <span className="text-primary">{numberToIdr({ nominal: order.subtotal as number })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Ongkos Kirim</span>
              <span className="text-primary">{numberToIdr({ nominal: order.shipping_cost as number })}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-white/10">
              <span className="text-primary">Total</span>
              <span className="text-primary">{numberToIdr({ nominal: order.total as number })}</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        {order.xendit_payment_method && (
          <div className="mt-4 text-center">
            <p className="text-secondary text-xs">
              Dibayar via {order.xendit_payment_method as string}
              {order.paid_at ? ` pada ${new Date(order.paid_at as string).toLocaleDateString("id-ID")}` : ""}
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
