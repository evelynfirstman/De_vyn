import { pool } from "./db";
import { redis } from "./redis";
import { logger } from "./logger";

type MilestoneCtx = {
  completionsTotal: number;
  streakCount: number;
  bestScore: number | null;
  paidOrders: number;
};

type Definition = {
  kind: string;
  label: string;
  message: (ctx: MilestoneCtx) => string;
  check: (ctx: MilestoneCtx) => boolean;
};

const DEFINITIONS: Definition[] = [
  {
    kind: "first_session",
    label: "First session completed",
    message: () =>
      "You completed your first guided session. Keep the momentum.",
    check: (c) => c.completionsTotal >= 1,
  },
  {
    kind: "sessions_10",
    label: "10 sessions completed",
    message: () =>
      "Double digits — 10 guided sessions done. Your consistency is paying off.",
    check: (c) => c.completionsTotal >= 10,
  },
  {
    kind: "streak_3",
    label: "3-day streak",
    message: () => "Three days in a row. Small steps, compounding recovery.",
    check: (c) => c.streakCount >= 3,
  },
  {
    kind: "streak_7",
    label: "7-day streak",
    message: () => "A full week of check-ins. This is the habit working.",
    check: (c) => c.streakCount >= 7,
  },
  {
    kind: "score_80",
    label: "Recovery score 80+",
    message: () =>
      "You hit an 80+ recovery score. Whatever you did — repeat it.",
    check: (c) => (c.bestScore ?? 0) >= 80,
  },
  {
    kind: "first_order",
    label: "First order placed",
    message: () =>
      "Your first recovery order is on its way. Gear + guidance beats gear alone.",
    check: (c) => c.paidOrders >= 1,
  },
];

/**
 * Evaluate all milestone definitions for a user, persisting newly
 * achieved ones plus a notification each. Idempotent via UNIQUE(user, kind).
 * Called after check-ins and session completions. Returns new kinds.
 */
export async function evaluateMilestones(userId: number): Promise<string[]> {
  const [completions, streakRaw, scores, orders, existing] = await Promise.all([
    pool.query(
      "SELECT COUNT(*)::int AS total FROM session_completions WHERE user_id = $1",
      [userId],
    ),
    redis.get(`streak:${userId}`).catch((err: unknown) => {
      logger.warn({ err }, "streak read failed during milestone eval");
      return null;
    }),
    pool.query(
      "SELECT MAX(score)::int AS best FROM recovery_scores WHERE user_id = $1",
      [userId],
    ),
    pool.query(
      "SELECT COUNT(*)::int AS total FROM orders WHERE user_id = $1 AND status IN ('paid', 'fulfilled')",
      [userId],
    ),
    pool.query("SELECT kind FROM milestones WHERE user_id = $1", [userId]),
  ]);

  let streakCount = 0;
  try {
    const parsed = streakRaw
      ? (JSON.parse(streakRaw) as { count?: number })
      : null;
    streakCount = parsed?.count ?? 0;
  } catch {
    streakCount = 0;
  }

  const ctx: MilestoneCtx = {
    completionsTotal: completions.rows[0].total as number,
    streakCount,
    bestScore: (scores.rows[0].best as number | null) ?? null,
    paidOrders: orders.rows[0].total as number,
  };

  const have = new Set(
    (existing.rows as { kind: string }[]).map((r) => r.kind),
  );
  const achieved: string[] = [];
  for (const def of DEFINITIONS) {
    if (have.has(def.kind) || !def.check(ctx)) continue;
    await pool.query(
      `INSERT INTO milestones (user_id, kind, label)
       VALUES ($1, $2, $3) ON CONFLICT (user_id, kind) DO NOTHING`,
      [userId, def.kind, def.label],
    );
    await pool.query(
      `INSERT INTO notifications (user_id, kind, title, body)
       VALUES ($1, 'milestone', $2, $3)`,
      [userId, `🏆 ${def.label}`, def.message(ctx)],
    );
    achieved.push(def.kind);
  }
  return achieved;
}
