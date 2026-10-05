"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.V1_WEIGHTS = void 0;
exports.computeScore = computeScore;
exports.computeScoreV1 = computeScoreV1;
exports.isDefaultWeights = isDefaultWeights;
exports.V1_WEIGHTS = {
    base: 35,
    sleepHigh: 15,
    sleepMid: 8,
    sorenessPer: 4,
    stressPer: 3,
    completionPer: 3,
    completionCap: 9,
    highAt: 70,
    midAt: 40,
    streakBonusCap: 0,
};
function computeScore(inputs, weights = exports.V1_WEIGHTS, streakCount = 0) {
    const sleep = inputs.sleepHours >= 7.5
        ? weights.sleepHigh
        : inputs.sleepHours >= 6
            ? weights.sleepMid
            : 0;
    const soreness = (5 - inputs.soreness) * weights.sorenessPer;
    const stress = (5 - inputs.stress) * weights.stressPer;
    const completion = Math.min(weights.completionCap, Math.max(0, inputs.completionsLast7Days) * weights.completionPer);
    const streak = Math.min(weights.streakBonusCap, Math.max(0, streakCount));
    const score = Math.max(0, Math.min(100, weights.base + sleep + soreness + stress + completion + streak));
    const band = score >= weights.highAt ? "high" : score >= weights.midAt ? "mid" : "low";
    const label = band === "high" ? "Ready" : band === "mid" ? "Easy day" : "Rest";
    return {
        score,
        band,
        label,
        breakdown: {
            base: weights.base,
            sleep,
            soreness,
            stress,
            completion,
            streak,
        },
    };
}
/** v1 entry point (kept for compatibility + existing tests). */
function computeScoreV1(inputs) {
    return computeScore(inputs, exports.V1_WEIGHTS, 0);
}
function isDefaultWeights(w) {
    return JSON.stringify(w) === JSON.stringify(exports.V1_WEIGHTS);
}
//# sourceMappingURL=score.js.map