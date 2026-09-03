import { describe, it, expect } from "vitest";
import { toUtcStamp, buildCalendarLinks } from "./calendar";

describe("toUtcStamp", () => {
  it("converts a WIB wall-clock datetime to the correct UTC instant", () => {
    // 2026-09-09 11:00 WIB (UTC+7) === 2026-09-09 04:00 UTC
    expect(toUtcStamp("2026-09-09", "11:00")).toBe("20260909T040000Z");
  });

  it("applies addHours for session length", () => {
    // 17:00 WIB + 2h === 12:00 UTC
    expect(toUtcStamp("2026-09-09", "17:00", 2)).toBe("20260909T120000Z");
  });

  it("rolls to the previous UTC day when the slot starts early WIB", () => {
    // 24:00 not a slot, but 01:00 WIB (hypothetical) => 18:00 UTC the day before
    expect(toUtcStamp("2026-09-09", "01:00")).toBe("20260908T180000Z");
  });

  it("is independent of the host timezone", () => {
    const realTZ = process.env.TZ;
    try {
      process.env.TZ = "America/Los_Angeles";
      expect(toUtcStamp("2026-09-09", "11:00")).toBe("20260909T040000Z");
    } finally {
      if (realTZ === undefined) delete process.env.TZ;
      else process.env.TZ = realTZ;
    }
  });
});

describe("buildCalendarLinks", () => {
  const { gcal, ics } = buildCalendarLinks("2026-09-09", "14:00");
  const icsText = decodeURIComponent(ics.replace("data:text/calendar;charset=utf-8,", ""));

  it("builds a Google Calendar TEMPLATE URL with UTC start/end", () => {
    expect(gcal).toContain("https://calendar.google.com/calendar/render?action=TEMPLATE");
    // 14:00 WIB => 07:00 UTC, 2h session => 09:00 UTC
    expect(gcal).toContain("dates=20260909T070000Z/20260909T090000Z");
    expect(gcal).toContain("text=Konsultasi%20Kopi%20Agroastery");
    expect(gcal).toContain("location=");
  });

  it("emits a structurally valid VCALENDAR with UTC DTSTART/DTEND", () => {
    expect(icsText).toContain("BEGIN:VCALENDAR");
    expect(icsText).toContain("BEGIN:VEVENT");
    expect(icsText).toContain("DTSTART:20260909T070000Z");
    expect(icsText).toContain("DTEND:20260909T090000Z");
    expect(icsText).toContain("END:VEVENT");
    expect(icsText).toContain("END:VCALENDAR");
    expect(icsText).toContain(
      "UID:konsultasi-2026-09-09-1400@agroastery.com"
    );
  });

  it("escapes commas in ICS TEXT fields (RFC 5545)", () => {
    // ADDRESS contains commas — they must arrive backslash-escaped.
    const locationLine = icsText.split("\r\n").find((l) => l.startsWith("LOCATION:"));
    expect(locationLine).toBeDefined();
    expect(locationLine).toContain("\\,");
    // The value after LOCATION: must contain no raw comma.
    expect(locationLine!.slice("LOCATION:".length)).not.toMatch(/(?<!\\),/);
  });

  it("uses CRLF line endings throughout", () => {
    expect(icsText).toContain("\r\n");
    expect(icsText).not.toMatch(/\r(?!\n)/);
    expect(icsText).not.toMatch(/(?<!\r)\n/);
  });

  it("keeps every real consultation slot within its booking day in UTC", () => {
    for (const slot of ["11:00", "14:00", "17:00"]) {
      const { gcal: g } = buildCalendarLinks("2026-09-09", slot);
      const match = g.match(/dates=(\d{8})T\d{6}Z\/(\d{8})T\d{6}Z/);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("20260909");
      expect(match![2]).toBe("20260909");
    }
  });
});
