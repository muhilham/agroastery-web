import { describe, it, expect } from "vitest";
import {
  CONSULTATION_TIME_SLOTS,
  CONSULTATION_WEEKDAYS,
  CONSULTATION_FEE_IDR,
  CONSULTATION_WINDOW_WEEKS,
  isConsultationSlot,
} from "./constants";

describe("consultation constants", () => {
  it("defines exactly three slots", () => {
    expect(CONSULTATION_TIME_SLOTS).toEqual(["11:00", "14:00", "17:00"]);
  });

  it("defines Tue/Wed/Thu as valid weekdays (JS getDay: 2,3,4)", () => {
    expect(CONSULTATION_WEEKDAYS).toEqual([2, 3, 4]);
  });

  it("fee is 250k IDR", () => {
    expect(CONSULTATION_FEE_IDR).toBe(250_000);
  });

  it("window is 4 weeks", () => {
    expect(CONSULTATION_WINDOW_WEEKS).toBe(4);
  });

  it("isConsultationSlot validates slot strings", () => {
    expect(isConsultationSlot("11:00")).toBe(true);
    expect(isConsultationSlot("17:00")).toBe(true);
    expect(isConsultationSlot("10:00")).toBe(false);
    expect(isConsultationSlot("")).toBe(false);
  });
});
