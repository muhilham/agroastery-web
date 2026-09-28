import { describe, it, expect } from "vitest";
import { formatSoldCount, formatAllChannelSold } from "./formatSoldCount";

describe("formatSoldCount", () => {
  it("returns empty string for null/zero/negative", () => {
    expect(formatSoldCount(null)).toBe("");
    expect(formatSoldCount(0)).toBe("");
    expect(formatSoldCount(-5)).toBe("");
  });

  it("shows exact number below 1000", () => {
    expect(formatSoldCount(84)).toBe("84 terjual");
    expect(formatSoldCount(999)).toBe("999 terjual");
  });

  it("rounds to nearest hundred and shows rb+ from 1000", () => {
    expect(formatSoldCount(7204)).toBe("7.2rb+ terjual");
    expect(formatSoldCount(1599)).toBe("1.6rb+ terjual");
  });

  it("rounds to nearest thousand from 10000", () => {
    expect(formatSoldCount(21736)).toBe("22rb+ terjual");
    expect(formatSoldCount(10000)).toBe("10rb+ terjual");
  });
});

describe("formatAllChannelSold", () => {
  it("returns empty string for null/zero", () => {
    expect(formatAllChannelSold(null)).toBe("");
    expect(formatAllChannelSold(0)).toBe("");
  });

  it("appends the di semua channel label to the base format", () => {
    expect(formatAllChannelSold(21736)).toBe("22rb+ terjual di semua channel");
    expect(formatAllChannelSold(84)).toBe("84 terjual di semua channel");
  });
});