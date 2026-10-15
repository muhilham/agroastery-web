import { Resend } from "resend";
import * as React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { PaymentLink } from "./templates/PaymentLink";

export async function sendPaymentLinkEmail(orderId: string): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) return;
    const admin = createSupabaseAdminClient();
    const { data: order, error } = await admin
      .from("ecom_orders")
      .select("id, order_number, total, customer_email")
      .eq("id", orderId)
      .single();
    if (error || !order || !order.customer_email) return;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://agroastery.com";
    const { error: sendError } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "Agroastery <order@agroastery.com>",
      to: order.customer_email as string,
      subject: `Selesaikan pembayaran pesanan ${order.order_number} — Agroastery`,
      react: React.createElement(PaymentLink, {
        orderNumber: order.order_number as string,
        total: order.total as number,
        paymentUrl: `${appUrl}/checkout/payment/${order.id}`,
      }),
    });
    if (sendError) console.error(`[sendPaymentLinkEmail] Resend error for order ${orderId}:`, sendError);
  } catch (error) {
    console.error(`[sendPaymentLinkEmail] Unexpected error for order ${orderId}:`, error);
  }
}
