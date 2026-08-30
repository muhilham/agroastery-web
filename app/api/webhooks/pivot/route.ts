import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendPaymentNotification } from "@/lib/telegram/notify";
import { sendOpsAlert } from "@/lib/telegram/opsAlert";
import { createBiteshipDraft } from '@/lib/biteship/createDraft';
import { sendOrderEmail } from "@/lib/resend/sendOrderEmail";
import { createJubelioOrderFromEcom } from "@/lib/jubelio/orders";
import { sendConsultationConfirmationEmail } from "@/lib/resend/sendConsultationEmail";
import { sendConsultationBookingAlert, sendConsultationConflictAlert } from "@/lib/consultations/notify";

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
      await handleConsultationPaid(supabase, paymentSessionId, paidAt);
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
      .select("id, order_number, customer_name, customer_phone, total, shipping_address")
      .single();

    if (error) {
      console.error("Pivot webhook: DB update error on PAID:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (updatedOrder) {
      // Fetch order items for WhatsApp message
      const { data: orderItems, error: itemsError } = await supabase
        .from("ecom_order_items")
        .select("product_name, quantity")
        .eq("order_id", updatedOrder.id);

      if (itemsError) {
        console.error(`[pivot-webhook] Failed to fetch items for order ${updatedOrder.id}:`, itemsError);
      }

      const shippingAddress = updatedOrder.shipping_address as Record<string, unknown> | null;
      const shippingAddressPhone = (shippingAddress?.phone as string) || null;

      sendPaymentNotification({
        orderId: updatedOrder.id as string,
        orderNumber: updatedOrder.order_number as string,
        customerName: updatedOrder.customer_name as string,
        customerPhone: updatedOrder.customer_phone as string,
        shippingAddressPhone,
        paymentMethod: "QRIS",
        total: updatedOrder.total as number,
        paidAt,
        items: (orderItems ?? []).map((i) => ({
          productName: i.product_name as string,
          quantity: i.quantity as number,
        })),
      }).catch((err: unknown) =>
        console.error(
          `[pivot-webhook] Payment notification failed for order ${updatedOrder.id}:`,
          err
        )
      );

      // Fire-and-forget: create Biteship draft order after payment confirmed.
      // Never awaited — Pivot expects a fast 200. Failure is logged for manual ops recovery.
      createBiteshipDraft(updatedOrder.id as string).catch((err: unknown) => {
        console.error(
          `[pivot-webhook] Biteship draft creation failed for order ${updatedOrder.id}:`,
          err
        );
        // Alert ops immediately — customer paid but no shipment created. Requires manual action.
        sendOpsAlert({
          orderId: updatedOrder.id as string,
          orderNumber: updatedOrder.order_number as string,
          issue: "BITESHIP GAGAL — buat order manual",
          action: "Cek log atau gunakan endpoint retry manual",
        }).catch(() => {});
      });

      sendOrderEmail(updatedOrder.id as string).catch((err: unknown) =>
        console.error(
          `[pivot-webhook] Order email failed for order ${updatedOrder.id}:`,
          err
        )
      );

      // Fire-and-forget: push order to Jubelio (must never block the webhook)
      createJubelioOrderFromEcom(updatedOrder.id as string).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[pivot-webhook] Jubelio order sync failed for order ${updatedOrder.id}:`,
          message
        );
        // Alert ops immediately — customer paid but Jubelio sync failed.
        sendPaymentNotification({
          orderId: updatedOrder.id as string,
          orderNumber: updatedOrder.order_number as string,
          customerName: updatedOrder.customer_name as string,
          customerPhone: updatedOrder.customer_phone as string,
          paymentMethod: `⚠️ JUBELIO GAGAL — ${message.slice(0, 200)}`,
          total: updatedOrder.total as number,
          paidAt: new Date().toISOString(),
        }).catch(() => {});
      });
    }
  } else if (event === "PAYMENT.EXPIRED" || event === "PAYMENT.CANCELLED") {
    // Idempotently cancel the order (use neq to act as a lock)
    const { data: cancelledOrder, error: cancelError } = await supabase
      .from("ecom_orders")
      .update({ payment_status: "expired", status: "cancelled" })
      .eq("pivot_payment_session_id", paymentSessionId)
      .not("payment_status", "in", '("expired","paid")')
      .select("id")
      .maybeSingle();

    if (cancelError) {
      console.error("Pivot webhook: DB error on EXPIRED/CANCELLED:", cancelError);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (!cancelledOrder) {
      await handleConsultationExpired(supabase, paymentSessionId);
      return NextResponse.json({ received: true });
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

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

async function handleConsultationPaid(
  supabase: SupabaseAdmin,
  paymentSessionId: string,
  paidAt: string
): Promise<void> {
  const { data: booking } = await supabase
    .from("consultation_bookings")
    .select("id, status, name, phone, booking_date, time_slot, purpose, notes, amount")
    .eq("pivot_payment_session_id", paymentSessionId)
    .maybeSingle();

  if (!booking) {
    console.warn(`Pivot webhook: no consultation booking for session ${paymentSessionId}`);
    return;
  }
  if (booking.status === "confirmed") return;

  const fromStatus = booking.status as string;
  const { error } = await supabase
    .from("consultation_bookings")
    .update({ status: "confirmed", paid_at: paidAt, updated_at: new Date().toISOString() })
    .eq("id", booking.id as string)
    .eq("status", fromStatus);

  if (error) {
    if (error.code === "23505" || fromStatus === "expired") {
      await supabase
        .from("consultation_bookings")
        .update({ paid_at: paidAt, updated_at: new Date().toISOString() })
        .eq("id", booking.id as string);
      sendConsultationConflictAlert({
        bookingId: booking.id as string,
        name: booking.name as string,
        phone: booking.phone as string,
        bookingDate: String(booking.booking_date),
        timeSlot: String(booking.time_slot),
      }).catch(() => {});
      return;
    }
    console.error("Pivot webhook: consultation confirm error:", error);
    return;
  }

  sendConsultationConfirmationEmail(booking.id as string).catch((err: unknown) =>
    console.error(`[pivot-webhook] consultation email failed for ${booking.id}:`, err)
  );
  sendConsultationBookingAlert({
    name: booking.name as string,
    phone: booking.phone as string,
    bookingDate: String(booking.booking_date),
    timeSlot: String(booking.time_slot),
    purpose: String(booking.purpose),
    notes: (booking.notes as string | null) ?? null,
    amount: booking.amount as number,
  }).catch((err: unknown) =>
    console.error(`[pivot-webhook] consultation telegram failed for ${booking.id}:`, err)
  );
}

async function handleConsultationExpired(
  supabase: SupabaseAdmin,
  paymentSessionId: string
): Promise<void> {
  const { error } = await supabase
    .from("consultation_bookings")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("pivot_payment_session_id", paymentSessionId)
    .eq("status", "pending_payment");

  if (error && error.code !== "PGRST116") {
    console.error("Pivot webhook: consultation expire error:", error);
  }
}
