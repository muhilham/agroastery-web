import * as React from "react";

export interface ConsultationBookingEmailProps {
  customerName: string;
  bookingDate: string;
  timeSlot: string;
  manageUrl: string;
  whatsappUrl: string;
  variant: "confirmed" | "rescheduled" | "cancelled";
}

export function ConsultationBookingEmail({
  customerName,
  bookingDate,
  timeSlot,
  manageUrl,
  whatsappUrl,
  variant,
}: ConsultationBookingEmailProps) {
  const heading =
    variant === "confirmed"
      ? "Konsultasi kamu terkonfirmasi"
      : variant === "rescheduled"
        ? "Jadwal konsultasi diperbarui"
        : "Konsultasi dibatalkan";

  return (
    <div style={{ fontFamily: "sans-serif", color: "#1a1a1a", maxWidth: 480 }}>
      <h2>{heading}</h2>
      <p>Halo {customerName},</p>
      {variant !== "cancelled" ? (
        <>
          <p>
            Jadwal konsultasi kopi kamu: <strong>{bookingDate}</strong> jam{" "}
            <strong>{timeSlot} WIB</strong> (2 jam).
          </p>
          <p>
            Bawa bahan sendiri (susu, gula, dll) — kecuali biji kopi. Tim kami
            juga bisa belanjakan; biaya ditambahkan ke invoice akhir.
          </p>
          <p>
            <a
              href={whatsappUrl}
              style={{
                display: "inline-block",
                background: "#25D366",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: 8,
                textDecoration: "none",
                marginRight: 8,
              }}
            >
              Koordinasi bahan via WhatsApp
            </a>
            <a href={manageUrl} style={{ color: "#1a1a1a" }}>
              Kelola booking
            </a>
          </p>
        </>
      ) : (
        <p>
          Booking konsultasi kamu untuk <strong>{bookingDate}</strong> jam{" "}
          <strong>{timeSlot} WIB</strong> telah dibatalkan. Refund akan
          diproses manual oleh tim kami melalui WhatsApp.
        </p>
      )}
      <p style={{ color: "#666", fontSize: 12 }}>Agroastery</p>
    </div>
  );
}
