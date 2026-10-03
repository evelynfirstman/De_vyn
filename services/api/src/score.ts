/**
 * Recovery score engine (Phases 4 + 10).
 *
 * v1: fixed documented weights (see V1_WEIGHTS).
 * v2: same formula with DB-tunable weights from score_configs plus a
 *     small streak bonus. The API reports which version produced a score.
 */
export type ScoreInputs = {
  soreness: number;
  sleepHours: number;
  stress: number;
  completionsLast7Days: number;
};

export type ScoreWeights = {
  base: number;
  sleepHigh: number;
  sleepMid: number;
  sorenessPer: number;
  stressPer: number;
  completionPer: number;
  completionCap: number;
  highAt: number;
  midAt: number;
  streakBonusCap: number;
};

export const V1_WEIGHTS: ScoreWeights = {
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

export type ScoreBand = "low" | "mid" | "high";

export type ScoreResult = {
  score: number;
  band: ScoreBand;
  label: string;
  breakdown: {
    base: number;
    sleep: number;
    soreness: number;
    stress: number;
    completion: number;
    streak: number;
  };
};

export function computeScore(
  inputs: ScoreInputs,
  weights: ScoreWeights = V1_WEIGHTS,
  streakCount = 0,
): ScoreResult {
  const sleep =
    inputs.sleepHours >= 7.5
      ? weights.sleepHigh
      : inputs.sleepHours >= 6
        ? weights.sleepMid
        : 0;
  const soreness = (5 - inputs.soreness) * weights.sorenessPer;
  const stress = (5 - inputs.stress) * weights.stressPer;
  const completion = Math.min(
    weights.completionCap,
    Math.max(0, inputs.completionsLast7Days) * weights.completionPer,
  );
  const streak = Math.min(weights.streakBonusCap, Math.max(0, streakCount));
  const score = Math.max(
    0,
    Math.min(
      100,
      weights.base + sleep + soreness + stress + completion + streak,
    ),
  );
  const band: ScoreBand =
    score >= weights.highAt ? "high" : score >= weights.midAt ? "mid" : "low";
  const label =
    band === "high" ? "Ready" : band === "mid" ? "Easy day" : "Rest";
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
export function computeScoreV1(inputs: ScoreInputs): ScoreResult {
  return computeScore(inputs, V1_WEIGHTS, 0);
}

export function isDefaultWeights(w: ScoreWeights): boolean {
  return JSON.stringify(w) === JSON.stringify(V1_WEIGHTS);
}
