import { describe, expect, it } from "vitest";
import { dayBefore, displayStreak, nextStreak, weekdayName } from "./streak";

describe("nextStreak", () => {
  it("starts at 1 on first check-in", () => {
    expect(nextStreak(null, "2026-09-27")).toEqual({
      count: 1,
      lastDate: "2026-09-27",
    });
  });

  it("is idempotent for same-day resubmits", () => {
    const prev = { count: 4, lastDate: "2026-09-27" };
    expect(nextStreak(prev, "2026-09-27")).toEqual(prev);
  });

  it("increments on consecutive days", () => {
    expect(
      nextStreak({ count: 4, lastDate: "2026-09-27" }, "2026-09-28"),
    ).toEqual({ count: 5, lastDate: "2026-09-28" });
  });

  it("resets after a missed day", () => {
    expect(
      nextStreak({ count: 9, lastDate: "2026-09-25" }, "2026-09-27"),
    ).toEqual({ count: 1, lastDate: "2026-09-27" });
  });

  it("handles month boundaries", () => {
    expect(dayBefore("2026-10-01")).toBe("2026-09-30");
    expect(
      nextStreak({ count: 2, lastDate: "2026-09-30" }, "2026-10-01"),
    ).toEqual({ count: 3, lastDate: "2026-10-01" });
  });

  it("is immune to DST transitions (UTC-noon arithmetic)", () => {
    // Europe/Lagos has no DST, but EU/US spring-forward / fall-back
    // dates must still step exactly one day.
    expect(dayBefore("2026-03-30")).toBe("2026-03-29");
    expect(dayBefore("2026-10-26")).toBe("2026-10-25");
    expect(
      nextStreak({ count: 3, lastDate: "2026-10-25" }, "2026-10-26"),
    ).toEqual({ count: 4, lastDate: "2026-10-26" });
  });
});

describe("displayStreak", () => {
  it("shows count when last check-in was today or yesterday", () => {
    expect(
      displayStreak({ count: 5, lastDate: "2026-09-27" }, "2026-09-27"),
    ).toBe(5);
    expect(
      displayStreak({ count: 5, lastDate: "2026-09-26" }, "2026-09-27"),
    ).toBe(5);
  });

  it("shows 0 once the chain has lapsed", () => {
    expect(
      displayStreak({ count: 5, lastDate: "2026-09-25" }, "2026-09-27"),
    ).toBe(0);
    expect(displayStreak(null, "2026-09-27")).toBe(0);
  });
});

describe("weekdayName", () => {
  it("maps dates Monday-first, including Sundays", () => {
    expect(weekdayName("2026-09-28")).toBe("Mon");
    expect(weekdayName("2026-09-27")).toBe("Sun");
    expect(weekdayName("2026-09-30")).toBe("Wed");
  });
});
