import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import QRCode from "qrcode";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("ecom_orders")
    .select("order_number, pivot_qr_string")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const qrString = data.pivot_qr_string;
  if (!qrString) {
    return NextResponse.json(
      { error: "QR string not available for this order" },
      { status: 400 }
    );
  }

  try {
    const buffer = await QRCode.toBuffer(qrString, {
      width: 512,
      margin: 4,
      type: "png",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    const orderNumber = (data.order_number as string) || orderId;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="qris-${orderNumber}.png"`,
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate QR image" },
      { status: 500 }
    );
  }
}
