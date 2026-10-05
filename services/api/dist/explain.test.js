"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const explain_1 = require("./explain");
(0, vitest_1.describe)("plan explanation guardrails (Phase 10 eval set)", () => {
    const docs = [
        { title: "Neck strain basics", source: "physio review" },
        { title: "Sleep hygiene", source: "coach notes" },
    ];
    (0, vitest_1.it)("cites sources, disclaimer and escalation", () => {
        const exp = (0, explain_1.buildExplanation)({
            itemCount: 3,
            painAreas: ["neck"],
            docs,
        });
        (0, vitest_1.expect)(exp.sources).toEqual(docs);
        (0, vitest_1.expect)(exp.disclaimer).toBe(explain_1.EXPLANATION_DISCLAIMER);
        (0, vitest_1.expect)(exp.escalation).toMatch(/support/i);
        (0, vitest_1.expect)((0, explain_1.explanationViolations)(exp)).toEqual([]);
    });
    (0, vitest_1.it)("handles empty pain areas without diagnosis language", () => {
        const exp = (0, explain_1.buildExplanation)({ itemCount: 1, painAreas: [], docs: [] });
        (0, vitest_1.expect)(exp.summary).toMatch(/general recovery/);
        (0, vitest_1.expect)((0, explain_1.explanationViolations)(exp)).toEqual([]);
    });
    (0, vitest_1.it)("flags banned diagnosis phrases", () => {
        const exp = (0, explain_1.buildExplanation)({ itemCount: 2, painAreas: ["back"], docs });
        const tampered = {
            ...exp,
            summary: `${exp.summary} It looks like you have a herniated disc.`,
        };
        (0, vitest_1.expect)((0, explain_1.explanationViolations)(tampered)).toContain("banned phrase: you have");
    });
    (0, vitest_1.it)("flags missing disclaimer or escalation", () => {
        const exp = (0, explain_1.buildExplanation)({ itemCount: 2, painAreas: [], docs: [] });
        (0, vitest_1.expect)((0, explain_1.explanationViolations)({ ...exp, disclaimer: "" }).length).toBeGreaterThan(0);
        (0, vitest_1.expect)((0, explain_1.explanationViolations)({ ...exp, escalation: "" }).length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=explain.test.js.map