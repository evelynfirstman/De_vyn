import { describe, expect, it } from "vitest";
import { computeScoreV1 } from "./score";

describe("computeScoreV1", () => {
  it("scores a worst day as low", () => {
    const r = computeScoreV1({
      soreness: 5,
      sleepHours: 4,
      stress: 5,
      completionsLast7Days: 0,
    });
    expect(r.score).toBe(35);
    expect(r.band).toBe("low");
    expect(r.label).toBe("Rest");
  });

  it("scores a typical day as mid", () => {
    const r = computeScoreV1({
      soreness: 3,
      sleepHours: 7,
      stress: 3,
      completionsLast7Days: 1,
    });
    // 35 + 8 + 8 + 6 + 3
    expect(r.score).toBe(60);
    expect(r.band).toBe("mid");
  });

  it("scores a great day as high", () => {
    const r = computeScoreV1({
      soreness: 2,
      sleepHours: 8,
      stress: 2,
      completionsLast7Days: 2,
    });
    // 35 + 15 + 12 + 9 + 6
    expect(r.score).toBe(77);
    expect(r.band).toBe("high");
    expect(r.label).toBe("Ready");
  });

  it("clamps to 0–100", () => {
    const top = computeScoreV1({
      soreness: 1,
      sleepHours: 9,
      stress: 1,
      completionsLast7Days: 99,
    });
    expect(top.score).toBeLessThanOrEqual(100);
    expect(top.breakdown.completion).toBe(9);
  });

  it("treats sleep boundaries exactly", () => {
    const atSix = computeScoreV1({
      soreness: 3,
      sleepHours: 6,
      stress: 3,
      completionsLast7Days: 0,
    });
    const belowSix = computeScoreV1({
      soreness: 3,
      sleepHours: 5.99,
      stress: 3,
      completionsLast7Days: 0,
    });
    expect(atSix.breakdown.sleep).toBe(8);
    expect(belowSix.breakdown.sleep).toBe(0);
  });
});
