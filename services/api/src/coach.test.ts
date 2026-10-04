import { describe, expect, it } from "vitest";
import {
  buildCoachMessages,
  callGroq,
  COACH_FALLBACK,
  keywordQuery,
  scanReply,
} from "./coach";

describe("coach guardrails eval set (Phase 10)", () => {
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

  it("builds a system prompt with rules + user context + KB", () => {
    const msgs = buildCoachMessages(ctx, [], "What should I do today?");
    expect(msgs[0].role).toBe("system");
    expect(msgs[0].content).toMatch(/NOT a medical professional/);
    expect(msgs[0].content).toMatch(/healthcare professional/);
    expect(msgs[0].content).toMatch(/Neck strain basics/);
    expect(msgs[0].content).toMatch(/74/);
    expect(msgs[msgs.length - 1]).toEqual({
      role: "user",
      content: "What should I do today?",
    });
  });

  it("caps history at 10 messages", () => {
    const history = Array.from({ length: 30 }, (_, i) => ({
      role: "user" as const,
      content: `m${i}`,
    }));
    const msgs = buildCoachMessages(ctx, history, "hi");
    expect(msgs.length).toBe(12); // system + 10 + current
  });

  it("flags diagnosis language", () => {
    expect(scanReply("All good, keep moving.")).toEqual([]);
    expect(scanReply("It sounds like you have a herniated disc.")).toContain(
      "you have",
    );
  });

  it("fallback redirects to safe help", () => {
    expect(COACH_FALLBACK).toMatch(/healthcare professional/);
  });

  it("builds OR keyword queries from natural sentences", () => {
    expect(keywordQuery("My neck is stiff from desk work today")).toBe(
      "neck | stiff | from | desk | work | today",
    );
    expect(keywordQuery("a an the of to")).toBeNull();
    expect(keywordQuery("neck neck neck pain")).toBe("neck | pain");
  });

  it("callGroq throws on empty reply", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ choices: [] }), {
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;
    try {
      await expect(callGroq("k", "m", [])).rejects.toThrow("empty reply");
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
