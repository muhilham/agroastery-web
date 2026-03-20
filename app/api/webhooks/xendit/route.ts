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
      // Restore stock for expired orders
      const { data: expiredOrder } = await supabase
        .from("ecom_orders")
        .select("id, payment_status")
        .eq("xendit_invoice_id", invoiceId)
        .single();

      if (expiredOrder && expiredOrder.payment_status !== "expired") {
        // Restore stock from order items
        const { data: orderItems } = await supabase
          .from("ecom_order_items")
          .select("variant_id, quantity")
          .eq("order_id", expiredOrder.id);

        if (orderItems) {
          for (const item of orderItems) {
            const { data: current } = await supabase
              .from("product_variants")
              .select("stock_quantity")
              .eq("id", item.variant_id)
              .single();
            if (current) {
              await supabase
                .from("product_variants")
                .update({ stock_quantity: (current.stock_quantity as number) + (item.quantity as number) })
                .eq("id", item.variant_id);
            }
          }
        }

        const { error } = await supabase
          .from("ecom_orders")
          .update({
            payment_status: "expired",
            status: "cancelled",
          })
          .eq("xendit_invoice_id", invoiceId);

        if (error) {
          console.error("Webhook: failed to update order for EXPIRED:", error);
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
