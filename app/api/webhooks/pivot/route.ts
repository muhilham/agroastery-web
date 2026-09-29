import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendPaymentNotification } from "@/lib/telegram/notify";
import { sendOpsAlert } from "@/lib/telegram/opsAlert";
import { createBiteshipDraft } from '@/lib/biteship/createDraft';
import { retryBiteshipDraft, isRetryableDraftError } from '@/lib/biteship/retryDraft';
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

    const paidFields = {
      payment_status: "paid",
      status: "processing",
      paid_at: paidAt,
      payment_method: "QRIS", // Pivot QRIS is B2C primary (issue #170)
    };
    const selectFields =
      "id, order_number, customer_name, customer_phone, total, shipping_address";

    // CAS ladder (issue #187): each conditional UPDATE is atomic at the row
    // level, so `wasExpired` is derived from which transition actually won —
    // never from the stale read above. PAYMENT.EXPIRED can land between the
    // read and the write (stock already released); the second, expired-scoped
    // step probes the LIVE status, so a late payment is never dropped just
    // because the read predated the expiry.
    let { data: updatedOrder, error } = await supabase
      .from("ecom_orders")
      .update(paidFields)
      .eq("pivot_payment_session_id", paymentSessionId)
      .not("payment_status", "in", '("expired","paid")')
      .select(selectFields)
      .maybeSingle();
    let wasExpired = false;

    if (!error && !updatedOrder) {
      // Late payment: the session expired and EXPIRED already released this
      // order's stock — resurrect the order and claw the stock back below.
      ({ data: updatedOrder, error } = await supabase
        .from("ecom_orders")
        .update(paidFields)
        .eq("pivot_payment_session_id", paymentSessionId)
        .eq("payment_status", "expired")
        .select(selectFields)
        .maybeSingle());
      wasExpired = true;
    }

    if (error) {
      console.error("Pivot webhook: DB update error on PAID:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (!updatedOrder) {
      // Lost every CAS step: a concurrent delivery already paid the order.
      // Idempotent no-op — never double-run the paid pipeline.
      return NextResponse.json({ received: true });
    }

    if (wasExpired) {
      // The customer paid AFTER the session expired and the EXPIRED handler
      // already released this order's stock. Re-reserve it now — before the
      // Biteship draft below — or the order ships against free stock (#187).
      const reserve = await reReserveStockForLatePayment(supabase, updatedOrder.id as string);
      sendOpsAlert({
        orderId: updatedOrder.id as string,
        orderNumber: updatedOrder.order_number as string,
        issue: reserve.ok
          ? "LATE PAID setelah QRIS expired — stok berhasil di-reserve ulang"
          : `LATE PAID setelah QRIS expired — RE-RESERVE GAGAL: ${reserve.error?.slice(0, 200) ?? "unknown"}`,
        action: reserve.ok ? null : "Tahan pengiriman, cek stok manual sebelum kirim",
      }).catch(() => {});
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
      // Never awaited — Pivot expects a fast 200. Transient failures (e.g.
      // courier-side unavailability) route into the backed-off retry chain;
      // only data/config bugs alert immediately (#199).
      createBiteshipDraft(updatedOrder.id as string).catch((err: unknown) => {
        console.error(
          `[pivot-webhook] Biteship draft creation failed for order ${updatedOrder.id}:`,
          err
        );
        if (!isRetryableDraftError(err)) {
          // Non-retryable (order/items/API-key/reference data bugs) —
          // retrying re-hits the same failure; alert ops immediately.
          sendOpsAlert({
            orderId: updatedOrder.id as string,
            orderNumber: updatedOrder.order_number as string,
            issue: "BITESHIP GAGAL — buat order manual",
            action: "Cek log atau gunakan endpoint retry manual",
          }).catch(() => {});
          return;
        }
        // Retryable — the terminal alert fires only after the chain exhausts
        // (retryDraft sends BITESHIP GAGAL 3x). .catch guard mandatory: the
        // exhaustion branch's supabase calls are unguarded (same pattern as
        // biteship webhook retry wiring).
        retryBiteshipDraft(updatedOrder.id as string).catch((retryErr: unknown) =>
          console.error(
            `[pivot-webhook] draft retry chain failed for order ${updatedOrder.id}:`,
            retryErr
          )
        );
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
          paymentMethod: "QRIS",
          total: updatedOrder.total as number,
          paidAt: new Date().toISOString(),
        }).catch(() => {});
        sendOpsAlert({
          orderId: updatedOrder.id as string,
          orderNumber: updatedOrder.order_number as string,
          issue: `JUBELIO GAGAL — ${message.slice(0, 200)}`,
          action: "Cek log atau sync manual",
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

/**
 * Re-reserve stock for an order whose QRIS payment landed AFTER the session
 * expired (issue #187). The PAYMENT.EXPIRED handler released the stock via
 * ecom_restore_stock, so a late PAID would otherwise ship against inventory
 * another buyer may already have claimed.
 *
 * Uses ecom_decrement_stock_multi — the same all-or-nothing primitive checkout
 * uses at order creation (lib/checkout/stockValidation.ts). Two reasons this
 * is the only correct choice:
 * - The single-item ecom_decrement_stock returns FALSE (no error) when stock
 *   is insufficient, so checking `error` alone silently "succeeds" on the exact
 *   oversell case we are guarding against.
 * - multi decrements every item in one transaction and raises on any
 *   insufficient stock, so a partial failure can never leave half the order
 *   re-reserved.
 * Note PostgREST can surface rejection either as an error OR as data=false;
 * both paths must fail closed.
 */
async function reReserveStockForLatePayment(
  supabase: SupabaseAdmin,
  orderId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: orderItems, error: itemsError } = await supabase
    .from("ecom_order_items")
    .select("variant_id, quantity")
    .eq("order_id", orderId);

  if (itemsError) {
    return { ok: false, error: `fetch items: ${itemsError.message}` };
  }

  const items = (orderItems ?? [])
    .filter((item) => item.variant_id)
    .map((item) => ({ variant_id: item.variant_id, quantity: item.quantity }));

  if (items.length === 0) {
    return { ok: false, error: "no items with variant_id found for order" };
  }

  const { data, error } = await supabase.rpc("ecom_decrement_stock_multi", {
    p_items: items,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "ecom_decrement_stock_multi returned false (insufficient stock)" };
  }
  return { ok: true };
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
