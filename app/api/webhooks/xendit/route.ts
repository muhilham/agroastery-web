import { NextRequest, NextResponse } from "next/server";
import { verifyXenditWebhook } from "@/lib/xendit/webhook";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendPaymentNotification } from "@/lib/telegram/notify";

export async function POST(request: NextRequest) {
  if (!verifyXenditWebhook(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const supabase = createSupabaseAdminClient();

    const invoiceId = body.id;
    const status = body.status;

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoice id" }, { status: 400 });
    }

    if (status === "PAID") {
      // Use Xendit's paid_at timestamp if available, otherwise fallback to now
      const paidAt = body.paid_at ?? new Date().toISOString();
      const paymentMethod = body.payment_method ?? body.payment_channel ?? null;

      // Idempotency: only update if not already paid
      const { data: existingOrder } = await supabase
        .from("ecom_orders")
        .select("id, payment_status")
        .eq("xendit_invoice_id", invoiceId)
        .single();

      if (existingOrder?.payment_status === "paid") {
        // Already processed — return success without re-updating
        return NextResponse.json({ received: true });
      }

      const { data: updatedOrder, error } = await supabase
        .from("ecom_orders")
        .update({
          payment_status: "paid",
          status: "processing",
          paid_at: paidAt,
          xendit_payment_method: paymentMethod,
        })
        .eq("xendit_invoice_id", invoiceId)
        .select("id, order_number, customer_name, customer_phone, total")
        .single();

      if (error) {
        console.error("Webhook: failed to update order for PAID:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
      }

      // Notify Telegram (fire-and-forget)
      if (updatedOrder) {
        sendPaymentNotification({
          orderId: updatedOrder.id as string,
          orderNumber: updatedOrder.order_number as string,
          customerName: updatedOrder.customer_name as string,
          customerPhone: updatedOrder.customer_phone as string,
          paymentMethod,
          total: updatedOrder.total as number,
          paidAt,
        });
      }
    } else if (status === "EXPIRED") {
      // Idempotency: mark order as expired FIRST (acts as lock), then restore stock
      const { data: updatedExpired, error: expiredError } = await supabase
        .from("ecom_orders")
        .update({
          payment_status: "expired",
          status: "cancelled",
        })
        .eq("xendit_invoice_id", invoiceId)
        .neq("payment_status", "expired")
        .select("id")
        .single();

      if (expiredError?.code === "PGRST116") {
        // No rows matched — already expired or not found, skip
        return NextResponse.json({ received: true });
      }
      if (expiredError) {
        console.error("Webhook: failed to update order for EXPIRED:", expiredError);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
      }

      // Restore stock atomically via RPC
      if (updatedExpired) {
        const { data: orderItems } = await supabase
          .from("ecom_order_items")
          .select("variant_id, quantity")
          .eq("order_id", updatedExpired.id);

        if (orderItems) {
          for (const item of orderItems) {
            if (item.variant_id) {
              await supabase.rpc("ecom_restore_stock", {
                p_variant_id: item.variant_id,
                p_quantity: item.quantity,
              });
            }
          }
        }
      }
    } else {
      console.log(`Webhook: unhandled Xendit status "${status}" for invoice ${invoiceId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
