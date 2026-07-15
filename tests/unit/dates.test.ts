import { describe, expect, it } from "vitest";
import { ageFromDateOfBirth, countdownTo, formatRelativeEnd, isWithinWindow } from "@/lib/dates";

describe("countdownTo", () => {
  it("splits the remaining time into parts", () => {
    const now = new Date("2026-07-15T00:00:00Z");
    const end = new Date("2026-07-16T01:02:03Z");
    const parts = countdownTo(end, now);
    expect(parts).toMatchObject({ days: 1, hours: 1, minutes: 2, seconds: 3, isPast: false });
  });

  it("clamps past dates and flags them", () => {
    const now = new Date("2026-07-15T00:00:00Z");
    const parts = countdownTo(new Date("2026-07-14T00:00:00Z"), now);
    expect(parts.isPast).toBe(true);
    expect(parts.days).toBe(0);
    expect(parts.seconds).toBe(0);
  });
});

describe("formatRelativeEnd", () => {
  it("describes the window honestly", () => {
    const now = new Date();
    expect(formatRelativeEnd(new Date(now.getTime() - 1000))).toBe("Ended");
    expect(formatRelativeEnd(new Date(now.getTime() + 3 * 86_400_000 + 60_000))).toMatch(
      /Ends in 3 days/,
    );
    expect(formatRelativeEnd(new Date(now.getTime() + 2 * 3_600_000 + 60_000))).toMatch(
      /Ends in 2h/,
    );
  });
});

describe("isWithinWindow", () => {
  const start = "2026-07-01T00:00:00Z";
  const end = "2026-07-31T00:00:00Z";
  it("is inclusive of start, exclusive of end", () => {
    expect(isWithinWindow(start, end, new Date(start))).toBe(true);
    expect(isWithinWindow(start, end, new Date(end))).toBe(false);
    expect(isWithinWindow(start, end, new Date("2026-07-15T12:00:00Z"))).toBe(true);
  });
});

describe("ageFromDateOfBirth", () => {
  it("computes whole years across birthdays", () => {
    const now = new Date("2026-07-15T00:00:00Z");
    expect(ageFromDateOfBirth("2008-07-15", now)).toBe(18);
    expect(ageFromDateOfBirth("2008-07-16", now)).toBe(17);
    expect(ageFromDateOfBirth("1990-01-01", now)).toBe(36);
  });
});
