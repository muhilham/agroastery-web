import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

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

  const { data: updated, error } = await supabase
    .from("ecom_orders")
    .update({
      payment_status: "paid",
      status: "processing",
      paid_at: new Date().toISOString(),
      xendit_payment_method: "QRIS_DEV_SIMULATE",
    })
    .eq("id", orderId)
    .eq("payment_status", "unpaid")
    .select("id");

  if (error) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: "Order not found or already paid" },
      { status: 404 }
    );
  }

  return NextResponse.json({ simulated: true });
}
