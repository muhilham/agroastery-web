import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getTodayWIB,
  isRoastDate,
  diffDays,
  addDays,
  formatDateID,
  milestoneStatus,
} from "./date";

describe("getTodayWIB", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the WIB calendar date when local time is past midnight WIB", () => {
    vi.useFakeTimers();
    // 2026-08-18T20:00:00Z = 2026-08-19 03:00 WIB
    vi.setSystemTime(new Date("2026-08-18T20:00:00Z"));
    expect(getTodayWIB(new Date())).toBe("2026-08-19");
  });

  it("returns the same calendar date during WIB daytime", () => {
    vi.useFakeTimers();
    // 2026-08-18T10:00:00Z = 2026-08-18 17:00 WIB
    vi.setSystemTime(new Date("2026-08-18T10:00:00Z"));
    expect(getTodayWIB(new Date())).toBe("2026-08-18");
  });

  it("is independent of the host machine timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-18T20:00:00Z"));
    const realTz = process.env.TZ;
    process.env.TZ = "America/New_York";
    try {
      expect(getTodayWIB(new Date())).toBe("2026-08-19");
    } finally {
      process.env.TZ = realTz;
    }
  });
});

describe("isRoastDate", () => {
  it("accepts a valid YYYY-MM-DD string", () => {
    expect(isRoastDate("2026-08-04")).toBe(true);
  });

  it("rejects non-YYYY-MM-DD formats", () => {
    expect(isRoastDate("04-08-2026")).toBe(false);
    expect(isRoastDate("2026/08/04")).toBe(false);
    expect(isRoastDate("")).toBe(false);
  });

  it("rejects impossible calendar dates", () => {
    expect(isRoastDate("2026-02-30")).toBe(false);
    expect(isRoastDate("2026-13-01")).toBe(false);
  });
});

describe("diffDays", () => {
  it("counts calendar days between dates", () => {
    expect(diffDays("2026-08-04", "2026-08-18")).toBe(14);
  });

  it("returns 0 for the same date", () => {
    expect(diffDays("2026-08-04", "2026-08-04")).toBe(0);
  });

  it("returns negative when target is before source", () => {
    expect(diffDays("2026-08-18", "2026-08-04")).toBe(-14);
  });

  it("handles month boundaries", () => {
    expect(diffDays("2026-08-31", "2026-09-01")).toBe(1);
  });
});

describe("addDays", () => {
  it("adds days across month boundaries", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
  });

  it("adds 3 days to the spec example", () => {
    expect(addDays("2026-08-04", 3)).toBe("2026-08-07");
  });

  it("round-trips with diffDays", () => {
    expect(addDays("2026-08-04", 21)).toBe("2026-08-25");
  });
});

describe("formatDateID", () => {
  it("formats as written-out Indonesian date", () => {
    expect(formatDateID("2026-08-04")).toBe("4 Agustus 2026");
  });

  it("formats the 17th of August correctly", () => {
    expect(formatDateID("2045-08-17")).toBe("17 Agustus 2045");
  });
});

describe("milestoneStatus", () => {
  it("returns today when milestone date equals today", () => {
    expect(milestoneStatus("2026-08-18", "2026-08-18")).toEqual({ kind: "today" });
  });

  it("returns future with day count", () => {
    expect(milestoneStatus("2026-08-25", "2026-08-18")).toEqual({ kind: "future", days: 7 });
  });

  it("returns past with day count", () => {
    expect(milestoneStatus("2026-08-07", "2026-08-18")).toEqual({ kind: "past", days: 11 });
  });
});
