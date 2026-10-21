import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createQrisPaymentSession, QRIS_MAX_HOLD_MINUTES } from "@/lib/pivot/client";

const RefreshSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RefreshSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { orderId } = parsed.data;
    const supabase = createSupabaseAdminClient();

    const { data: order, error } = await supabase
      .from("ecom_orders")
      .select(
        "id, order_number, total, payment_status, status, created_at, customer_name, customer_email, customer_phone"
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Real enum: `pending_payment` is the ORDER status; payment_status is
    // unpaid/paid/expired/refunded. Checking payment_status alone rejected
    // every genuine unpaid order with 400 - auto-reissue never ran.
    if (!(order.payment_status === "unpaid" && order.status === "pending_payment")) {
      return NextResponse.json(
        { error: "Order is not awaiting payment" },
        { status: 400 }
      );
    }

    if (Date.now() - new Date(order.created_at as string).getTime() > QRIS_MAX_HOLD_MINUTES * 60_000) {
      // Atomic lock (same pattern as the PAYMENT.EXPIRED webhook): only cancel
      // if still awaiting payment — a late PAID must never be overwritten.
      const { data: locked } = await supabase
        .from("ecom_orders")
        .update({ status: "cancelled", payment_status: "expired" })
        .eq("id", orderId)
        .eq("payment_status", "unpaid")
        .eq("status", "pending_payment")
        .select("id")
        .maybeSingle();
      if (!locked) {
        return NextResponse.json(
          { error: "Status pesanan berubah. Muat ulang halaman.", code: "STATE_CHANGED" },
          { status: 409 }
        );
      }
      const { data: items } = await supabase
        .from("ecom_order_items")
        .select("variant_id, quantity")
        .eq("order_id", orderId);
      for (const item of items ?? []) {
        if (item.variant_id) {
          await supabase.rpc("ecom_restore_stock", {
            p_variant_id: item.variant_id as string,
            p_quantity: item.quantity as number,
          });
        }
      }
      return NextResponse.json(
        { error: "Batas waktu pemesanan telah terlewati. Silakan pesan ulang.", code: "HOLD_EXPIRED" },
        { status: 410 }
      );
    }

    // Suffix with current timestamp to guarantee a unique X-REQUEST-ID
    const suffix = Date.now().toString(36);
    const session = await createQrisPaymentSession(
      {
        orderId: order.id as string,
        orderNumber: order.order_number as string,
        total: order.total as number,
        customerName: order.customer_name as string,
        customerEmail: order.customer_email as string | null,
        customerPhone: order.customer_phone as string,
      },
      suffix
    );

    const { error: updateError } = await supabase
      .from("ecom_orders")
      .update({
        pivot_payment_session_id: session.paymentSessionId,
        pivot_qr_url: session.qrUrl,
        pivot_qr_string: session.qrString,
        pivot_qr_expires_at: session.qrExpiresAt,
        pivot_qr_acquirer: session.acquirer,
      })
      .eq("id", orderId);
    if (updateError) throw updateError;

    return NextResponse.json({
      qrUrl: session.qrUrl,
      qrString: session.qrString,
      qrExpiresAt: session.qrExpiresAt,
    });
  } catch (error) {
    console.error("Refresh QR error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
