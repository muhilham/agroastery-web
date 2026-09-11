import { describe, it, expect } from "vitest";
import {
  classifyRateGroup,
  etaFloorHours,
  formatEta,
  joinCarrierService,
} from "@/lib/shipping/labels";

describe("formatEta", () => {
  it("converts day ranges to Bahasa with en-dash", () => {
    expect(formatEta("2 - 3 days")).toBe("2\u20133 hari");
    expect(formatEta("1 - 2 Days")).toBe("1\u20132 hari");
  });

  it("collapses degenerate ranges and singular days", () => {
    expect(formatEta("1 - 1 days")).toBe("1 hari");
    expect(formatEta("3 days")).toBe("3 hari");
  });

  it("accepts already-Bahasa numeric durations", () => {
    expect(formatEta("2 hari")).toBe("2 hari");
    expect(formatEta("1 - 1 hari")).toBe("1 hari");
  });

  it("passes unknown formats through unchanged", () => {
    expect(formatEta("Same day")).toBe("Same day");
    expect(formatEta("2 - 3 weeks")).toBe("2 - 3 weeks");
    expect(formatEta(undefined)).toBeNull();
    expect(formatEta("")).toBeNull();
  });

  it("converts hour ranges to Bahasa (geo couriers, #160)", () => {
    expect(formatEta("1 - 2 Hours")).toBe("1\u20132 jam");
    expect(formatEta("6 - 8 hours")).toBe("6\u20138 jam");
    expect(formatEta("2 - 2 Hours")).toBe("2 jam");
    expect(formatEta("3 jam")).toBe("3 jam");
  });
});

describe("etaFloorHours", () => {
  it("ranks hours below days and unparseables last", () => {
    expect(etaFloorHours("6 - 8 Hours")).toBe(6);
    expect(etaFloorHours("1 - 1 days")).toBe(24);
    expect(etaFloorHours("1 days")).toBe(24);
    expect(etaFloorHours(undefined)).toBe(Infinity);
    expect(etaFloorHours("Same day")).toBe(Infinity);
  });
});

describe("classifyRateGroup", () => {
  it("instan bucket = instant + same_day only", () => {
    expect(classifyRateGroup({ serviceType: "instant" })).toBe("instan");
    expect(classifyRateGroup({ serviceType: "same_day" })).toBe("instan");
    expect(classifyRateGroup({ serviceType: "sameday" })).toBe("instan");
  });

  it("everything else (incl. overnight, missing, unknown) is reguler", () => {
    expect(classifyRateGroup({ serviceType: "standard" })).toBe("reguler");
    expect(classifyRateGroup({ serviceType: "overnight" })).toBe("reguler");
    expect(classifyRateGroup({ serviceType: "future_value" })).toBe("reguler");
    expect(classifyRateGroup({})).toBe("reguler");
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
