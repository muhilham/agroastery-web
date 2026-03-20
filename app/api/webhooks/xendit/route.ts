import { NextRequest, NextResponse } from "next/server";
import { verifyXenditWebhook } from "@/lib/xendit/webhook";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

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
      const { error } = await supabase
        .from("ecom_orders")
        .update({
          payment_status: "paid",
          status: "processing",
          paid_at: new Date().toISOString(),
          xendit_payment_method: body.payment_method ?? body.payment_channel ?? null,
        })
        .eq("xendit_invoice_id", invoiceId);

      if (error) {
        console.error("Webhook: failed to update order for PAID:", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
      }

      // Optionally: deduct stock — can be done here or async
    } else if (status === "EXPIRED") {
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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
