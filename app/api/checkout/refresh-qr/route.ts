import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createQrisPaymentSession } from "@/lib/pivot/client";

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
        "id, order_number, total, payment_status, customer_name, customer_email, customer_phone"
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment_status !== "pending_payment") {
      return NextResponse.json(
        { error: "Order is not awaiting payment" },
        { status: 400 }
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

    await supabase
      .from("ecom_orders")
      .update({
        pivot_payment_session_id: session.paymentSessionId,
        pivot_qr_url: session.qrUrl,
        pivot_qr_expires_at: session.qrExpiresAt,
      })
      .eq("id", orderId);

    return NextResponse.json({
      qrUrl: session.qrUrl,
      qrExpiresAt: session.qrExpiresAt,
    });
  } catch (error) {
    console.error("Refresh QR error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
