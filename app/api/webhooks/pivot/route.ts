import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendPaymentNotification } from "@/lib/telegram/notify";
import { createBiteshipOrder } from '@/lib/biteship/createOrder';
import { sendOrderEmail } from "@/lib/resend/sendOrderEmail";

function verifyPivotCallback(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key") ?? "";
  const expected = process.env.PIVOT_CALLBACK_API_KEY ?? "";
  if (!apiKey || !expected) return false;
  try {
    return timingSafeEqual(Buffer.from(apiKey), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!verifyPivotCallback(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event as string;

  if (event === "PAYMENT.TEST") {
    return NextResponse.json({ received: true });
  }

  const data = body.data as Record<string, unknown>;
  const paymentSessionId = data?.id as string | undefined;

  if (!paymentSessionId) {
    return NextResponse.json({ error: "Missing payment session id" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (event === "PAYMENT.PAID") {
    const chargeDetails = data.chargeDetails as Array<Record<string, unknown>> | undefined;
    const paidAt = (chargeDetails?.[0]?.paidAt as string) ?? new Date().toISOString();

    // Idempotency: skip if already paid
    const { data: existing } = await supabase
      .from("ecom_orders")
      .select("id, payment_status")
      .eq("pivot_payment_session_id", paymentSessionId)
      .single();

    if (!existing) {
      console.warn(`Pivot webhook: no order found for session ${paymentSessionId}`);
      return NextResponse.json({ received: true });
    }

    if (existing.payment_status === "paid") {
      return NextResponse.json({ received: true });
    }

    const { data: updatedOrder, error } = await supabase
      .from("ecom_orders")
      .update({
        payment_status: "paid",
        status: "processing",
        paid_at: paidAt,
        xendit_payment_method: "QRIS", // reuse existing column for payment method label
      })
      .eq("pivot_payment_session_id", paymentSessionId)
      .select("id, order_number, customer_name, customer_phone, total")
      .single();

    if (error) {
      console.error("Pivot webhook: DB update error on PAID:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (updatedOrder) {
      sendPaymentNotification({
        orderId: updatedOrder.id as string,
        orderNumber: updatedOrder.order_number as string,
        customerName: updatedOrder.customer_name as string,
        customerPhone: updatedOrder.customer_phone as string,
        paymentMethod: "QRIS",
        total: updatedOrder.total as number,
        paidAt,
      }).catch((err: unknown) =>
        console.error(
          `[pivot-webhook] Payment notification failed for order ${updatedOrder.id}:`,
          err
        )
      );

      // Fire-and-forget: create Biteship order after payment confirmed.
      // Never awaited — Pivot expects a fast 200. Failure is logged for manual ops recovery.
      createBiteshipOrder(updatedOrder.id as string).catch((err: unknown) =>
        console.error(
          `[pivot-webhook] Biteship order creation failed for order ${updatedOrder.id}:`,
          err
        )
      );

      sendOrderEmail(updatedOrder.id as string).catch((err: unknown) =>
        console.error(
          `[pivot-webhook] Order email failed for order ${updatedOrder.id}:`,
          err
        )
      );
    }
  } else if (event === "PAYMENT.EXPIRED" || event === "PAYMENT.CANCELLED") {
    // Idempotently cancel the order (use neq to act as a lock)
    const { data: cancelledOrder, error: cancelError } = await supabase
      .from("ecom_orders")
      .update({ payment_status: "expired", status: "cancelled" })
      .eq("pivot_payment_session_id", paymentSessionId)
      .not("payment_status", "in", '("expired","paid")')
      .select("id")
      .single();

    if (cancelError?.code === "PGRST116") {
      // Already in terminal state — skip
      return NextResponse.json({ received: true });
    }
    if (cancelError) {
      console.error("Pivot webhook: DB error on EXPIRED/CANCELLED:", cancelError);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    // Restore stock
    if (cancelledOrder) {
      const { data: orderItems } = await supabase
        .from("ecom_order_items")
        .select("variant_id, quantity")
        .eq("order_id", cancelledOrder.id);

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
    console.log(`Pivot webhook: unhandled event "${event}" for session ${paymentSessionId}`);
  }

  return NextResponse.json({ received: true });
}
