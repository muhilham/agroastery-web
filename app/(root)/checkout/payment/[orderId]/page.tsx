import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import QrPaymentClient from "./qr-payment-client";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: order } = await supabase
    .from("ecom_orders")
    .select("id, order_number, total, payment_status, status, pivot_qr_url, pivot_qr_string, pivot_qr_expires_at")
    .eq("id", orderId)
    .single();

  if (!order) redirect("/checkout");

  const orderAny = order as typeof order & {
    pivot_qr_url: string | null;
    pivot_qr_string: string | null;
    pivot_qr_expires_at: string | null;
  };

  // Already paid → success page
  if (orderAny.payment_status === "paid") {
    redirect(`/checkout/success?order=${orderId}`);
  }

  // Cancelled — back to checkout
  if (orderAny.payment_status === "expired" || orderAny.status === "cancelled") {
    redirect("/checkout?error=order_cancelled");
  }

  return (
    <QrPaymentClient
      orderId={orderId}
      orderNumber={orderAny.order_number as string}
      total={orderAny.total as number}
      qrString={orderAny.pivot_qr_string ?? ""}
      qrExpiresAt={orderAny.pivot_qr_expires_at ?? ""}
    />
  );
}
