/**
 * Issue #200 A4 — courier-change WA link for a fallback swap.
 */
import { describe, it, expect } from "vitest";
import { buildCourierChangeWhatsAppLink } from "./whatsapp";

const BASE = {
  phone: "081234567890",
  customerName: "Budi",
  orderNumber: "AGR-20260928-97YXK5",
  oldCourier: "grab",
  oldService: "same_day",
  newCourier: "sicepat",
  newService: "gokil",
  newServiceName: "GOKIL",
  newEta: "6 - 8 hours",
};

describe("buildCourierChangeWhatsAppLink (#200 A2/A4)", () => {
  it("builds a wa.me link announcing the courier swap with ETA", () => {
    const link = buildCourierChangeWhatsAppLink(BASE);
    expect(link).not.toBeNull();
    const msg = decodeURIComponent(link!.split("text=")[1]);
    expect(msg).toContain("AGR-20260928-97YXK5");
    expect(msg).toContain("pindahkan ke kurir SICEPAT GOKIL");
    expect(msg).toContain("GRAB same_day sedang tidak tersedia");
    expect(msg).toContain("Estimasi tiba: 6 - 8 hours");
    // Hick's Law: one simple choice, never a ranked list of options.
    expect(msg).not.toContain("Rp");
  });

  it("returns null for an un-normalizable phone (caller falls back to manual contact)", () => {
    expect(buildCourierChangeWhatsAppLink({ ...BASE, phone: "not-a-phone" })).toBeNull();
  });

  it("uses the roastery sender number from ORIGIN_CONTACT_PHONE", () => {
    const link = buildCourierChangeWhatsAppLink(BASE)!;
    expect(link.startsWith("https://wa.me/628979092726?text=")).toBe(true);
  });
});
