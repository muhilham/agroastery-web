import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("ecom_orders")
    .select("payment_status, status")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    payment_status: data.payment_status,
    status: data.status,
  });
}
