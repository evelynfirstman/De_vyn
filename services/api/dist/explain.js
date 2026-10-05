"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPLANATION_DISCLAIMER = void 0;
exports.buildExplanation = buildExplanation;
exports.explanationViolations = explanationViolations;
exports.EXPLANATION_DISCLAIMER = "General wellness information only — not a medical diagnosis. " +
    "Stop and consult a professional if you feel sharp pain, numbness, or dizziness.";
const BANNED_PHRASES = [
    "you have",
    "you suffer from",
    "diagnos",
    "herniat",
    "fracture",
];
function buildExplanation(args) {
    const pains = args.painAreas.length > 0 ? args.painAreas.join(", ") : "general recovery";
    return {
        summary: `Your plan has ${args.itemCount} session(s) this week, ` +
            `matched to ${pains} from your profile and latest assessment.`,
        reasons: [
            `Sessions per week come from the days you said you can train.`,
            `Session length respects the minutes-per-session cap in your profile.`,
            `Programs are ordered longest-fitting first for recovery value per session.`,
        ],
        sources: args.docs,
        disclaimer: exports.EXPLANATION_DISCLAIMER,
        escalation: "Questions? Open a support ticket from your profile and a human will review your plan.",
    };
}
function explanationViolations(exp) {
    const haystack = `${exp.summary} ${exp.reasons.join(" ")}`.toLowerCase();
    const found = BANNED_PHRASES.filter((p) => haystack.includes(p));
    const problems = found.map((p) => `banned phrase: ${p}`);
    if (!exp.disclaimer || exp.disclaimer.length < 20) {
        problems.push("missing disclaimer");
    }
    if (!exp.escalation || exp.escalation.length < 10) {
        problems.push("missing escalation");
    }
    return problems;
}
//# sourceMappingURL=explain.js.map