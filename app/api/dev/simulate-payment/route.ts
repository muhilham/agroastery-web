import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { simulatePayment } from "@/lib/pivot/client";

const SimulateSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = SimulateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { orderId } = parsed.data;
  const supabase = createSupabaseAdminClient();

  const { data: order, error } = await supabase
    .from("ecom_orders")
    .select("pivot_payment_session_id, payment_status")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.payment_status === "paid") {
    return NextResponse.json({ error: "Order already paid" }, { status: 409 });
  }

  if (!order.pivot_payment_session_id) {
    return NextResponse.json({ error: "No Pivot payment session on this order" }, { status: 422 });
  }

  try {
    await simulatePayment(order.pivot_payment_session_id as string);
  } catch (err) {
    console.error("[dev/simulate-payment] Pivot simulation error:", err);
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }

  // Pivot staging will fire PAYMENT.PAID webhook → /api/webhooks/pivot handles DB + email + Biteship
  return NextResponse.json({ simulated: true });
}
