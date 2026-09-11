import { describe, it, expect } from "vitest";
import { formatEta, joinCarrierService } from "@/lib/shipping/labels";

describe("formatEta", () => {
  it("converts day ranges to Bahasa with en-dash", () => {
    expect(formatEta("2 - 3 days")).toBe("2\u20133 hari");
    expect(formatEta("1-2 days")).toBe("1\u20132 hari");
  });

  it("collapses degenerate ranges and singular days", () => {
    expect(formatEta("1 - 1 days")).toBe("1 hari");
    expect(formatEta("3 - 3 days")).toBe("3 hari");
    expect(formatEta("1 days")).toBe("1 hari");
    expect(formatEta("5 day")).toBe("5 hari");
  });

  it("accepts already-Bahasa numeric durations", () => {
    expect(formatEta("2 - 3 hari")).toBe("2\u20133 hari");
    expect(formatEta("1 hari")).toBe("1 hari");
  });

  it("passes through unknown formats untouched", () => {
    expect(formatEta("Same day")).toBe("Same day");
    expect(formatEta("2 - 3 weeks")).toBe("2 - 3 weeks");
  });

  it("returns null for missing eta", () => {
    expect(formatEta(undefined)).toBeNull();
    expect(formatEta("")).toBeNull();
  });
});

describe("joinCarrierService", () => {
  it("joins distinct carrier and service", () => {
    expect(joinCarrierService("JNE", "REG")).toBe("JNE REG");
    expect(joinCarrierService("SiCepat", "City to City (CTC)")).toBe(
      "SiCepat City to City (CTC)"
    );
  });

  it("does not duplicate a service that repeats the carrier", () => {
    expect(joinCarrierService("JNE", "JNE Trucking")).toBe("JNE Trucking");
    expect(joinCarrierService("JNE", "jne trucking")).toBe("jne trucking");
  });

  it("dedupes an exact repeat and handles blank service", () => {
    expect(joinCarrierService("JNE", "JNE")).toBe("JNE");
    expect(joinCarrierService("JNE", "  ")).toBe("JNE");
    expect(joinCarrierService("", "REG")).toBe("REG");
  });
});
