// lib/resend/templates/OrderConfirmation.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface OrderItem {
  product_name: string;
  variant_description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface ShippingAddress {
  recipient_name: string;
  phone: string;
  address_line: string;
  postal_code?: string | null;
}

export interface OrderConfirmationProps {
  orderNumber: string;
  orderId: string;
  createdAt: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  shippingCourier?: string | null;
  shippingService?: string | null;
  shippingEtd?: string | null;
  total: number;
  shippingAddress: ShippingAddress;
  trackingUrl: string;
}

function formatIdr(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  const str = rounded.toString();
  const parts: string[] = [];
  for (let i = str.length; i > 0; i -= 3) {
    parts.unshift(str.slice(Math.max(0, i - 3), i));
  }
  return `Rp ${parts.join(",")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function OrderConfirmation({
  orderNumber,
  createdAt,
  items,
  subtotal,
  shippingCost,
  shippingCourier,
  shippingService,
  shippingEtd,
  total,
  shippingAddress,
  trackingUrl,
}: OrderConfirmationProps) {
  const courierLabel =
    shippingCourier && shippingService
      ? `${shippingCourier.toUpperCase()} ${shippingService}`
      : shippingCourier?.toUpperCase() ?? "Courier";

  return (
    <Html>
      <Head />
      <Preview>Order {orderNumber} confirmed — Agroastery</Preview>
      <Body style={{ backgroundColor: "#f4f4f0", margin: 0, padding: "32px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Container style={{ maxWidth: "520px", margin: "0 auto", borderRadius: "16px", overflow: "hidden" }}>

          {/* Dark hero */}
          <Section style={{ backgroundColor: "#141414", padding: "32px 32px 28px", textAlign: "center" }}>
            <Text style={{ color: "rgba(204,196,169,0.5)", fontSize: "11px", fontWeight: "800", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 20px" }}>
              Agroastery
            </Text>
            <Text style={{ color: "#CCC4A9", fontSize: "22px", fontWeight: "700", margin: "0 0 6px" }}>
              Order Confirmed!
            </Text>
            <Text style={{ color: "rgba(204,196,169,0.45)", fontSize: "13px", margin: 0 }}>
              Thank you for your order. Here&apos;s your order summary.
            </Text>
          </Section>

          {/* Light body */}
          <Section style={{ backgroundColor: "#fafaf8", padding: "24px 28px" }}>

            {/* Order number chip */}
            <Section style={{ backgroundColor: "#f0ede6", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px" }}>
              <table width="100%" style={{ borderCollapse: "collapse" }}>
                <tr>
                  <td>
                    <Text style={{ color: "#999", fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>Order Number</Text>
                    <Text style={{ color: "#1a1a1a", fontSize: "14px", fontWeight: "700", fontFamily: "monospace", letterSpacing: "0.05em", margin: "2px 0 0" }}>{orderNumber}</Text>
                  </td>
                  <td style={{ textAlign: "right", verticalAlign: "top" }}>
                    <Text style={{ color: "#999", fontSize: "11px", margin: 0 }}>{formatDate(createdAt)}</Text>
                  </td>
                </tr>
              </table>
            </Section>

            {/* Items */}
            <Text style={{ color: "#999", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
              Items Ordered
            </Text>
            {items.map((item, i) => (
              <table key={i} width="100%" style={{ borderCollapse: "collapse", borderBottom: i < items.length - 1 ? "1px solid #ede9e0" : "none", paddingBottom: "8px", marginBottom: "8px" }}>
                <tr>
                  <td>
                    <Text style={{ color: "#1a1a1a", fontSize: "13px", fontWeight: "600", margin: 0 }}>{item.product_name}</Text>
                    <Text style={{ color: "#999", fontSize: "11px", margin: "2px 0 0" }}>{item.variant_description} × {item.quantity}</Text>
                  </td>
                  <td style={{ textAlign: "right", verticalAlign: "top" }}>
                    <Text style={{ color: "#1a1a1a", fontSize: "13px", fontWeight: "600", margin: 0 }}>{formatIdr(item.subtotal)}</Text>
                  </td>
                </tr>
              </table>
            ))}

            {/* Totals */}
            <Hr style={{ borderColor: "#ede9e0", margin: "12px 0 8px" }} />
            <table width="100%" style={{ borderCollapse: "collapse" }}>
              <tr>
                <td><Text style={{ color: "#666", fontSize: "12px", margin: "2px 0" }}>Subtotal</Text></td>
                <td style={{ textAlign: "right" }}><Text style={{ color: "#666", fontSize: "12px", margin: "2px 0" }}>{formatIdr(subtotal)}</Text></td>
              </tr>
              <tr>
                <td><Text style={{ color: "#666", fontSize: "12px", margin: "2px 0" }}>Shipping ({courierLabel})</Text></td>
                <td style={{ textAlign: "right" }}><Text style={{ color: "#666", fontSize: "12px", margin: "2px 0" }}>{formatIdr(shippingCost)}</Text></td>
              </tr>
            </table>
            <Hr style={{ borderColor: "#1a1a1a", margin: "8px 0" }} />
            <table width="100%" style={{ borderCollapse: "collapse" }}>
              <tr>
                <td><Text style={{ color: "#1a1a1a", fontSize: "14px", fontWeight: "700", margin: 0 }}>Total</Text></td>
                <td style={{ textAlign: "right" }}><Text style={{ color: "#1a1a1a", fontSize: "14px", fontWeight: "700", margin: 0 }}>{formatIdr(total)}</Text></td>
              </tr>
            </table>

            {/* Shipping address */}
            <Section style={{ backgroundColor: "#f0ede6", borderRadius: "8px", padding: "12px 14px", margin: "20px 0" }}>
              <Text style={{ color: "#1a1a1a", fontSize: "13px", fontWeight: "600", margin: "0 0 4px" }}>Shipping to</Text>
              <Text style={{ color: "#666", fontSize: "12px", lineHeight: "1.7", margin: 0 }}>
                {shippingAddress.recipient_name} · {shippingAddress.phone}
                <br />
                {shippingAddress.address_line}
                {shippingAddress.postal_code ? ` ${shippingAddress.postal_code}` : ""}
                {shippingEtd ? <><br />Estimated arrival: {shippingEtd}</> : null}
              </Text>
            </Section>

            {/* CTA */}
            <Button
              href={trackingUrl}
              style={{
                backgroundColor: "#1a1a1a",
                color: "#CCC4A9",
                borderRadius: "10px",
                padding: "14px 24px",
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                display: "block",
                textAlign: "center",
                width: "100%",
                boxSizing: "border-box",
                marginBottom: "8px",
              }}
            >
              Track My Order →
            </Button>
            <Text style={{ color: "#aaa", fontSize: "11px", textAlign: "center", margin: "4px 0 0" }}>
              Or copy: {trackingUrl}
            </Text>

          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: "#f0ede6", padding: "16px 28px", textAlign: "center" }}>
            <Text style={{ color: "#aaa", fontSize: "11px", lineHeight: "1.6", margin: 0 }}>
              Questions? Reach us on Instagram <strong style={{ color: "#666" }}>@agroastery</strong>
              <br />
              Agroastery · Jakarta, Indonesia
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
