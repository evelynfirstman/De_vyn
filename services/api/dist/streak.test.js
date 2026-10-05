"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const streak_1 = require("./streak");
(0, vitest_1.describe)("nextStreak", () => {
    (0, vitest_1.it)("starts at 1 on first check-in", () => {
        (0, vitest_1.expect)((0, streak_1.nextStreak)(null, "2026-09-27")).toEqual({
            count: 1,
            lastDate: "2026-09-27",
        });
    });
    (0, vitest_1.it)("is idempotent for same-day resubmits", () => {
        const prev = { count: 4, lastDate: "2026-09-27" };
        (0, vitest_1.expect)((0, streak_1.nextStreak)(prev, "2026-09-27")).toEqual(prev);
    });
    (0, vitest_1.it)("increments on consecutive days", () => {
        (0, vitest_1.expect)((0, streak_1.nextStreak)({ count: 4, lastDate: "2026-09-27" }, "2026-09-28")).toEqual({ count: 5, lastDate: "2026-09-28" });
    });
    (0, vitest_1.it)("resets after a missed day", () => {
        (0, vitest_1.expect)((0, streak_1.nextStreak)({ count: 9, lastDate: "2026-09-25" }, "2026-09-27")).toEqual({ count: 1, lastDate: "2026-09-27" });
    });
    (0, vitest_1.it)("handles month boundaries", () => {
        (0, vitest_1.expect)((0, streak_1.dayBefore)("2026-10-01")).toBe("2026-09-30");
        (0, vitest_1.expect)((0, streak_1.nextStreak)({ count: 2, lastDate: "2026-09-30" }, "2026-10-01")).toEqual({ count: 3, lastDate: "2026-10-01" });
    });
    (0, vitest_1.it)("is immune to DST transitions (UTC-noon arithmetic)", () => {
        // Europe/Lagos has no DST, but EU/US spring-forward / fall-back
        // dates must still step exactly one day.
        (0, vitest_1.expect)((0, streak_1.dayBefore)("2026-03-30")).toBe("2026-03-29");
        (0, vitest_1.expect)((0, streak_1.dayBefore)("2026-10-26")).toBe("2026-10-25");
        (0, vitest_1.expect)((0, streak_1.nextStreak)({ count: 3, lastDate: "2026-10-25" }, "2026-10-26")).toEqual({ count: 4, lastDate: "2026-10-26" });
    });
});
(0, vitest_1.describe)("displayStreak", () => {
    (0, vitest_1.it)("shows count when last check-in was today or yesterday", () => {
        (0, vitest_1.expect)((0, streak_1.displayStreak)({ count: 5, lastDate: "2026-09-27" }, "2026-09-27")).toBe(5);
        (0, vitest_1.expect)((0, streak_1.displayStreak)({ count: 5, lastDate: "2026-09-26" }, "2026-09-27")).toBe(5);
    });
    (0, vitest_1.it)("shows 0 once the chain has lapsed", () => {
        (0, vitest_1.expect)((0, streak_1.displayStreak)({ count: 5, lastDate: "2026-09-25" }, "2026-09-27")).toBe(0);
        (0, vitest_1.expect)((0, streak_1.displayStreak)(null, "2026-09-27")).toBe(0);
    });
});
(0, vitest_1.describe)("weekdayName", () => {
    (0, vitest_1.it)("maps dates Monday-first, including Sundays", () => {
        (0, vitest_1.expect)((0, streak_1.weekdayName)("2026-09-28")).toBe("Mon");
        (0, vitest_1.expect)((0, streak_1.weekdayName)("2026-09-27")).toBe("Sun");
        (0, vitest_1.expect)((0, streak_1.weekdayName)("2026-09-30")).toBe("Wed");
    });
});
//# sourceMappingURL=streak.test.js.map