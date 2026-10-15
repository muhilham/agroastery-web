import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import * as React from "react";
import { numberToIdr } from "@/lib/numberToIdr";

export function PaymentLink({ orderNumber, total, paymentUrl }: { orderNumber: string; total: number; paymentUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>Selesaikan pembayaran pesanan {orderNumber}</Preview>
      <Body style={{ backgroundColor: "#f4f4f0", margin: 0, padding: "32px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Container style={{ maxWidth: "520px", margin: "0 auto", borderRadius: "16px", overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#141414", padding: "32px 32px 28px", textAlign: "center" }}>
            <Text style={{ color: "rgba(204,196,169,0.5)", fontSize: "11px", fontWeight: "800", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 20px" }}>Agroastery</Text>
            <Text style={{ color: "#CCC4A9", fontSize: "22px", fontWeight: "700", margin: 0 }}>Selesaikan Pembayaran</Text>
          </Section>
          <Section style={{ backgroundColor: "#fafaf8", padding: "24px 28px", textAlign: "center" }}>
            <Text style={{ color: "#1a1a1a", fontSize: "15px", margin: "0 0 8px" }}>Pesanan <strong>{orderNumber}</strong></Text>
            <Text style={{ color: "#1a1a1a", fontSize: "22px", fontWeight: "700", margin: "0 0 20px" }}>{numberToIdr({ nominal: total })}</Text>
            <Button href={paymentUrl} style={{ backgroundColor: "#1a1a1a", color: "#CCC4A9", borderRadius: "10px", padding: "14px 24px", fontSize: "14px", fontWeight: "700", display: "block", textAlign: "center" }}>BAYAR DENGAN QRIS</Button>
            <Text style={{ color: "#666", fontSize: "12px", lineHeight: "1.6", margin: "20px 0 0" }}>QR akan diperbarui otomatis bila kedaluwarsa. Waktu pembayaran pesanan terbatas.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
