import { describe, it, expect, vi } from "vitest";
import { formatPhoneForWaMe, buildWhatsAppLink, buildPaymentWhatsAppLink } from "./whatsapp";

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with encoded message", () => {
    const link = buildWhatsAppLink("Halo, saya mau tanya");
    expect(link).toBe(
      "https://wa.me/628979092726?text=" + encodeURIComponent("Halo, saya mau tanya")
    );
  });

  it("encodes newlines and braces from booking context", () => {
    const msg = "Booking tanggal 2026-07-28 jam 11:00.\nSaya mau koordinasi bahan.";
    const link = buildWhatsAppLink(msg);
    expect(link.startsWith("https://wa.me/628979092726?text=")).toBe(true);
    expect(link).toContain(encodeURIComponent("\n"));
  });
});

describe("formatPhoneForWaMe", () => {
  it("converts 081... local format to 628...", () => {
    expect(formatPhoneForWaMe("08123456789")).toBe("628123456789");
  });

  it("converts +628... to 628...", () => {
    expect(formatPhoneForWaMe("+628123456789")).toBe("628123456789");
  });

  it("keeps 628... as-is", () => {
    expect(formatPhoneForWaMe("628123456789")).toBe("628123456789");
  });

  it("strips spaces and dashes before normalizing", () => {
    expect(formatPhoneForWaMe("+62 812-3456-789")).toBe("628123456789");
  });

  it("returns null for empty string", () => {
    expect(formatPhoneForWaMe("")).toBeNull();
  });

  it("returns null for non-numeric after cleanup", () => {
    expect(formatPhoneForWaMe("abc123")).toBeNull();
  });

  it("prepends 62 to bare numbers", () => {
    expect(formatPhoneForWaMe("8123456789")).toBe("628123456789");
  });

  it("returns null for short 62... numbers", () => {
    expect(formatPhoneForWaMe("62123")).toBeNull();
  });

  it("returns null for very short input", () => {
    expect(formatPhoneForWaMe("0")).toBeNull();
  });
});

describe("buildPaymentWhatsAppLink", () => {
  it("returns wa.me URL with pre-filled message", () => {
    const link = buildPaymentWhatsAppLink({
      phone: "08123456789",
      customerName: "Budi",
      orderNumber: "AGR-20260807-ABC123",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      items: [
        { productName: "Kopi Arabica", quantity: 2 },
        { productName: "Kopi Robusta", quantity: 1 },
      ],
      total: 150000,
      appUrl: "https://agroastery.com",
    });

    expect(link).toBeTruthy();
    expect(link).toContain("https://wa.me/628123456789");
    expect(link).toContain(encodeURIComponent("Halo Budi, order AGR-20260807-ABC123 sudah dikonfirmasi."));
    expect(link).toContain(encodeURIComponent("• Kopi Arabica ×2"));
    const formattedTotal = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(150000);
    expect(link).toContain(encodeURIComponent(`Total: ${formattedTotal}`));
    expect(link).toContain(encodeURIComponent("https://agroastery.com/track/550e8400-e29b-41d4-a716-446655440000/"));
  });

  it("returns null for invalid phone", () => {
    const link = buildPaymentWhatsAppLink({
      phone: "abc",
      customerName: "Budi",
      orderNumber: "AGR-001",
      orderId: "uuid",
      items: [],
      total: 100000,
    });
    expect(link).toBeNull();
  });

  it("skips items section when items empty", () => {
    const link = buildPaymentWhatsAppLink({
      phone: "08123456789",
      customerName: "Budi",
      orderNumber: "AGR-001",
      orderId: "uuid",
      items: [],
      total: 100000,
    });
    expect(link).toBeTruthy();
    expect(link).not.toContain("•");
  });

  it("uses NEXT_PUBLIC_APP_URL from env when appUrl not provided", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://test.agroastery.com");
    const link = buildPaymentWhatsAppLink({
      phone: "08123456789",
      customerName: "Budi",
      orderNumber: "AGR-001",
      orderId: "uuid",
      items: [{ productName: "Kopi", quantity: 1 }],
      total: 50000,
    });
    expect(link).toContain(encodeURIComponent("https://test.agroastery.com/track/uuid/"));
    const formattedTotal = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(50000);
    expect(link).toContain(encodeURIComponent(`Total: ${formattedTotal}`));
    vi.unstubAllEnvs();
  });

  it("falls back to default appUrl when param and env are absent", () => {
    const link = buildPaymentWhatsAppLink({
      phone: "08123456789",
      customerName: "Budi",
      orderNumber: "AGR-001",
      orderId: "uuid",
      items: [],
      total: 50000,
    });
    expect(link).toContain(encodeURIComponent("https://agroastery.com/track/uuid/"));
  });

  it("encodes special characters in names and product names", () => {
    const link = buildPaymentWhatsAppLink({
      phone: "08123456789",
      customerName: "Budi & Ani",
      orderNumber: "AGR-001",
      orderId: "uuid",
      items: [{ productName: "Kopi <special> edition", quantity: 1 }],
      total: 50000,
    });
    expect(link).toBeTruthy();
    expect(link).toContain(encodeURIComponent("Budi & Ani"));
    expect(link).toContain(encodeURIComponent("Kopi <special> edition"));
  });
});
