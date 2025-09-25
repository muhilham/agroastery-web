import { parseWeightToGrams, applyPackaging } from "@/lib/utils/weight";
import { describe, it, expect } from "vitest";

describe("weight helpers", () => {
  it("parses common labels", () => {
    expect(parseWeightToGrams("150g")).toBe(150);
    expect(parseWeightToGrams("0.5kg")).toBe(500);
  });
  it("applies packaging extras", () => {
    process.env.PACKAGING_EXTRA_GRAMS = "50";
    process.env.PACKAGING_EXTRA_PERCENT = "10";
    expect(applyPackaging(1000)).toBe(1000 * 1.1 + 50);
  });
});
