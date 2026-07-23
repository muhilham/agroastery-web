import { describe, it, expect } from "vitest";
import { buildWhatsAppLink } from "./whatsapp";

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
