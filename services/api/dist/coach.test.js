"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const coach_1 = require("./coach");
(0, vitest_1.describe)("coach guardrails eval set (Phase 10)", () => {
    const ctx = {
        name: "Demo",
        goals: ["Neck relief"],
        painAreas: ["neck"],
        minutesPerSession: 10,
        daysPerWeek: 4,
        planSummary: "Mon: Neck & Shoulder Reset",
        recentScores: [{ date: "2026-10-04", score: 74, band: "high" }],
        kbExcerpts: [
            {
                title: "Neck strain basics",
                body: "Chin tucks help.",
                source: "physio",
            },
        ],
    };
    (0, vitest_1.it)("builds a system prompt with rules + user context + KB", () => {
        const msgs = (0, coach_1.buildCoachMessages)(ctx, [], "What should I do today?");
        (0, vitest_1.expect)(msgs[0].role).toBe("system");
        (0, vitest_1.expect)(msgs[0].content).toMatch(/NOT a medical professional/);
        (0, vitest_1.expect)(msgs[0].content).toMatch(/healthcare professional/);
        (0, vitest_1.expect)(msgs[0].content).toMatch(/Neck strain basics/);
        (0, vitest_1.expect)(msgs[0].content).toMatch(/74/);
        (0, vitest_1.expect)(msgs[msgs.length - 1]).toEqual({
            role: "user",
            content: "What should I do today?",
        });
    });
    (0, vitest_1.it)("caps history at 10 messages", () => {
        const history = Array.from({ length: 30 }, (_, i) => ({
            role: "user",
            content: `m${i}`,
        }));
        const msgs = (0, coach_1.buildCoachMessages)(ctx, history, "hi");
        (0, vitest_1.expect)(msgs.length).toBe(12); // system + 10 + current
    });
    (0, vitest_1.it)("flags diagnosis language", () => {
        (0, vitest_1.expect)((0, coach_1.scanReply)("All good, keep moving.")).toEqual([]);
        (0, vitest_1.expect)((0, coach_1.scanReply)("It sounds like you have a herniated disc.")).toContain("you have");
    });
    (0, vitest_1.it)("fallback redirects to safe help", () => {
        (0, vitest_1.expect)(coach_1.COACH_FALLBACK).toMatch(/healthcare professional/);
    });
    (0, vitest_1.it)("builds OR keyword queries from natural sentences", () => {
        (0, vitest_1.expect)((0, coach_1.keywordQuery)("My neck is stiff from desk work today")).toBe("neck | stiff | from | desk | work | today");
        (0, vitest_1.expect)((0, coach_1.keywordQuery)("a an the of to")).toBeNull();
        (0, vitest_1.expect)((0, coach_1.keywordQuery)("neck neck neck pain")).toBe("neck | pain");
    });
    (0, vitest_1.it)("callGroq throws on empty reply", async () => {
        const realFetch = globalThis.fetch;
        globalThis.fetch = (async () => new Response(JSON.stringify({ choices: [] }), {
            headers: { "Content-Type": "application/json" },
        }));
        try {
            await (0, vitest_1.expect)((0, coach_1.callGroq)("k", "m", [])).rejects.toThrow("empty reply");
        }
        finally {
            globalThis.fetch = realFetch;
        }
    });
});
//# sourceMappingURL=coach.test.js.map