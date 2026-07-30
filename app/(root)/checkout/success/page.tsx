import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { MapPin } from "lucide-react";
import PurchaseTracking from "./PurchaseTracking";
import type { PurchaseItem } from "@/lib/analytics/gtag";

type PageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { order: orderId } = await searchParams;

  let orderNumber: string | null = null;
  let customerEmail: string | null = null;
  let isPickup = false;
  let paymentStatus: string | null = null;
  let total: number | null = null;
  let shippingCost = 0;
  let purchaseItems: PurchaseItem[] = [];

  if (orderId) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("ecom_orders")
      .select(
        "order_number, customer_email, shipping_courier, payment_status, total, shipping_cost, ecom_order_items(product_name, unit_price, quantity, variant_id)"
      )
      .eq("id", orderId)
      .single();
    orderNumber = (data?.order_number as string) ?? null;
    customerEmail = (data?.customer_email as string) ?? null;
    isPickup = data?.shipping_courier === "pickup";
    paymentStatus = (data?.payment_status as string) ?? null;
    total = (data?.total as number) ?? null;
    shippingCost = (data?.shipping_cost as number) ?? 0;
    const items =
      (data?.ecom_order_items as Array<{
        product_name: string;
        unit_price: number;
        quantity: number;
        variant_id: string | null;
      }> | null) ?? [];
    purchaseItems = items.map((i) => ({
      itemId: i.variant_id ?? i.product_name,
      itemName: i.product_name,
      price: i.unit_price,
      quantity: i.quantity,
    }));
  }

  const shouldTrackPurchase =
    paymentStatus === "paid" && !!orderNumber && total !== null;

  return (
    <div className="min-h-svh bg-background flex flex-col">
      {shouldTrackPurchase && (
        <PurchaseTracking
          transactionId={orderNumber as string}
          value={total as number}
          shipping={shippingCost}
          items={purchaseItems}
        />
      )}
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center py-16">

          {/* Check icon */}
          <div className="animate-in zoom-in-50 fade-in duration-500 mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <svg className="w-9 h-9 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div
            className="animate-in fade-in slide-in-from-bottom-3 duration-500"
            style={{ animationDelay: "150ms", animationFillMode: "both" }}
          >
            <h1 className="text-2xl font-semibold text-primary mb-2 tracking-wide">
              Order Confirmed!
            </h1>
            <p className="text-secondary text-sm leading-relaxed">
              Thank you for ordering from Agroastery.
            </p>

            {/* Order number chip */}
            {orderNumber && (
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                  Order
                </span>
                <span className="text-sm font-bold text-primary font-mono tracking-wide">
                  {orderNumber}
                </span>
              </div>
            )}

            {/* Email note — guests only */}
            {customerEmail && (
              <p className="text-xs text-secondary/50 mt-3 leading-relaxed">
                Confirmation &amp; tracking link sent to{" "}
                <span className="text-secondary font-medium">{customerEmail}</span>
              </p>
            )}
          </div>

          {/* CTAs */}
          <div
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-3 mt-8"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}
          >
            {orderId && (
              <Link href={`/track/${orderId}`}>
                <Button className="w-full h-12 gap-2">
                  <MapPin className="w-4 h-4" />
                  {isPickup ? "Lihat Info Pengambilan" : "Track My Order"}
                </Button>
              </Link>
            )}
            <Link href="/katalog">
              <Button className="w-full" variant="outline">
                Continue Shopping
              </Button>
            </Link>
          </div>

          <p className="text-[10px] uppercase tracking-widest text-primary/20 mt-8">
            {isPickup ? "Pesanan siap diambil setelah diproses" : "Your coffee is on its way"}
          </p>

        </div>
      </main>
    </div>
  );
}
