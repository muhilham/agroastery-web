import { Resend } from "resend";
import * as React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { OrderConfirmation } from "./templates/OrderConfirmation";

export async function sendOrderEmail(orderId: string): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("[sendOrderEmail] RESEND_API_KEY is not set — skipping email");
      return;
    }
    const admin = createSupabaseAdminClient();
    const { data: order, error } = await admin
      .from("ecom_orders")
      .select("*, ecom_order_items(*)")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error(`[sendOrderEmail] Order not found: ${orderId}`, error);
      return;
    }

    if (!order.customer_email) {
      return;
    }

    // Dedup guard: skip if already sent (handles concurrent webhook retries)
    if (order.email_sent_at) {
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agroastery.com";
    const trackingUrl = `${appUrl}/track/${orderId}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: "Agroastery <order@agroastery.com>",
      to: order.customer_email as string,
      subject: `Order ${order.order_number} confirmed — Agroastery`,
      react: React.createElement(OrderConfirmation, {
        orderNumber: order.order_number as string,
        orderId: order.id as string,
        createdAt: order.created_at as string,
        customerName: order.customer_name as string,
        items: (order.ecom_order_items as Array<{
          product_name: string;
          variant_description: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        }>),
        subtotal: order.subtotal as number,
        shippingCost: order.shipping_cost as number,
        shippingCourier: order.shipping_courier as string | null,
        shippingService: order.shipping_service as string | null,
        shippingEtd: order.shipping_etd as string | null,
        total: order.total as number,
        shippingAddress: order.shipping_address as {
          recipient_name: string;
          phone: string;
          address_line: string;
          postal_code?: string | null;
        },
        trackingUrl,
      }),
    });

    if (sendError) {
      console.error(`[sendOrderEmail] Resend error for order ${orderId}:`, sendError);
      return;
    }

    // Mark as sent — prevents duplicate emails on webhook retry
    await admin
      .from("ecom_orders")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", orderId);
  } catch (err) {
    console.error(`[sendOrderEmail] Unexpected error for order ${orderId}:`, err);
  }
}
