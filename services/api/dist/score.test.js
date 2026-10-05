"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const score_1 = require("./score");
(0, vitest_1.describe)("computeScoreV1", () => {
    (0, vitest_1.it)("scores a worst day as low", () => {
        const r = (0, score_1.computeScoreV1)({
            soreness: 5,
            sleepHours: 4,
            stress: 5,
            completionsLast7Days: 0,
        });
        (0, vitest_1.expect)(r.score).toBe(35);
        (0, vitest_1.expect)(r.band).toBe("low");
        (0, vitest_1.expect)(r.label).toBe("Rest");
    });
    (0, vitest_1.it)("scores a typical day as mid", () => {
        const r = (0, score_1.computeScoreV1)({
            soreness: 3,
            sleepHours: 7,
            stress: 3,
            completionsLast7Days: 1,
        });
        // 35 + 8 + 8 + 6 + 3
        (0, vitest_1.expect)(r.score).toBe(60);
        (0, vitest_1.expect)(r.band).toBe("mid");
    });
    (0, vitest_1.it)("scores a great day as high", () => {
        const r = (0, score_1.computeScoreV1)({
            soreness: 2,
            sleepHours: 8,
            stress: 2,
            completionsLast7Days: 2,
        });
        // 35 + 15 + 12 + 9 + 6
        (0, vitest_1.expect)(r.score).toBe(77);
        (0, vitest_1.expect)(r.band).toBe("high");
        (0, vitest_1.expect)(r.label).toBe("Ready");
    });
    (0, vitest_1.it)("clamps to 0–100", () => {
        const top = (0, score_1.computeScoreV1)({
            soreness: 1,
            sleepHours: 9,
            stress: 1,
            completionsLast7Days: 99,
        });
        (0, vitest_1.expect)(top.score).toBeLessThanOrEqual(100);
        (0, vitest_1.expect)(top.breakdown.completion).toBe(9);
    });
    (0, vitest_1.it)("treats sleep boundaries exactly", () => {
        const atSix = (0, score_1.computeScoreV1)({
            soreness: 3,
            sleepHours: 6,
            stress: 3,
            completionsLast7Days: 0,
        });
        const belowSix = (0, score_1.computeScoreV1)({
            soreness: 3,
            sleepHours: 5.99,
            stress: 3,
            completionsLast7Days: 0,
        });
        (0, vitest_1.expect)(atSix.breakdown.sleep).toBe(8);
        (0, vitest_1.expect)(belowSix.breakdown.sleep).toBe(0);
    });
});
//# sourceMappingURL=score.test.js.map