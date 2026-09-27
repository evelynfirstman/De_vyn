/**
 * Recovery score v1 — deterministic formula (Phase 4).
 *
 * Documented weights (recalibrate with real data in Phase 10):
 * - base:                         35
 * - sleep_hours >= 7.5 → +15; 6–7.5 → +8; < 6 → +0
 * - soreness (1 best – 5 worst):   (5 − soreness) × 4   → 16…0
 * - stress   (1 best – 5 worst):   (5 − stress) × 3     → 12…0
 * - completed sessions, last 7d:   × 3, capped at +9
 *   (no completions table until Phase 5 — pass 0 for now)
 * - total clamped to 0–100
 * - bands: >= 70 high ("Ready"), >= 40 mid ("Easy day"), else low ("Rest")
 */
export type ScoreInputs = {
  soreness: number;
  sleepHours: number;
  stress: number;
  completionsLast7Days: number;
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
  };
};

export function computeScoreV1(inputs: ScoreInputs): ScoreResult {
  const sleep = inputs.sleepHours >= 7.5 ? 15 : inputs.sleepHours >= 6 ? 8 : 0;
  const soreness = (5 - inputs.soreness) * 4;
  const stress = (5 - inputs.stress) * 3;
  const completion = Math.min(9, Math.max(0, inputs.completionsLast7Days) * 3);
  const score = Math.max(
    0,
    Math.min(100, 35 + sleep + soreness + stress + completion),
  );
  const band: ScoreBand = score >= 70 ? "high" : score >= 40 ? "mid" : "low";
  const label =
    band === "high" ? "Ready" : band === "mid" ? "Easy day" : "Rest";
  return {
    score,
    band,
    label,
    breakdown: { base: 35, sleep, soreness, stress, completion },
  };
}
