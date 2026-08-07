import { describe, it, expect } from "vitest";
import { formatPhoneForWaMe, buildWhatsAppLink } from "./whatsapp";

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
