import { describe, expect, it } from "vitest";
import {
  buildExplanation,
  explanationViolations,
  EXPLANATION_DISCLAIMER,
} from "./explain";

describe("plan explanation guardrails (Phase 10 eval set)", () => {
  const docs = [
    { title: "Neck strain basics", source: "physio review" },
    { title: "Sleep hygiene", source: "coach notes" },
  ];

  it("cites sources, disclaimer and escalation", () => {
    const exp = buildExplanation({
      itemCount: 3,
      painAreas: ["neck"],
      docs,
    });
    expect(exp.sources).toEqual(docs);
    expect(exp.disclaimer).toBe(EXPLANATION_DISCLAIMER);
    expect(exp.escalation).toMatch(/support/i);
    expect(explanationViolations(exp)).toEqual([]);
  });

  it("handles empty pain areas without diagnosis language", () => {
    const exp = buildExplanation({ itemCount: 1, painAreas: [], docs: [] });
    expect(exp.summary).toMatch(/general recovery/);
    expect(explanationViolations(exp)).toEqual([]);
  });

  it("flags banned diagnosis phrases", () => {
    const exp = buildExplanation({ itemCount: 2, painAreas: ["back"], docs });
    const tampered = {
      ...exp,
      summary: `${exp.summary} It looks like you have a herniated disc.`,
    };
    expect(explanationViolations(tampered)).toContain(
      "banned phrase: you have",
    );
  });

  it("flags missing disclaimer or escalation", () => {
    const exp = buildExplanation({ itemCount: 2, painAreas: [], docs: [] });
    expect(
      explanationViolations({ ...exp, disclaimer: "" }).length,
    ).toBeGreaterThan(0);
    expect(
      explanationViolations({ ...exp, escalation: "" }).length,
    ).toBeGreaterThan(0);
  });
});
