"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateMilestones = evaluateMilestones;
const db_1 = require("./db");
const redis_1 = require("./redis");
const logger_1 = require("./logger");
const DEFINITIONS = [
    {
        kind: "first_session",
        label: "First session completed",
        message: () => "You completed your first guided session. Keep the momentum.",
        check: (c) => c.completionsTotal >= 1,
    },
    {
        kind: "sessions_10",
        label: "10 sessions completed",
        message: () => "Double digits — 10 guided sessions done. Your consistency is paying off.",
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
        message: () => "You hit an 80+ recovery score. Whatever you did — repeat it.",
        check: (c) => (c.bestScore ?? 0) >= 80,
    },
    {
        kind: "first_order",
        label: "First order placed",
        message: () => "Your first recovery order is on its way. Gear + guidance beats gear alone.",
        check: (c) => c.paidOrders >= 1,
    },
];
/**
 * Evaluate all milestone definitions for a user, persisting newly
 * achieved ones plus a notification each. Idempotent via UNIQUE(user, kind).
 * Called after check-ins and session completions. Returns new kinds.
 */
async function evaluateMilestones(userId) {
    const [completions, streakRaw, scores, orders, existing] = await Promise.all([
        db_1.pool.query("SELECT COUNT(*)::int AS total FROM session_completions WHERE user_id = $1", [userId]),
        redis_1.redis.get(`streak:${userId}`).catch((err) => {
            logger_1.logger.warn({ err }, "streak read failed during milestone eval");
            return null;
        }),
        db_1.pool.query("SELECT MAX(score)::int AS best FROM recovery_scores WHERE user_id = $1", [userId]),
        db_1.pool.query("SELECT COUNT(*)::int AS total FROM orders WHERE user_id = $1 AND status IN ('paid', 'fulfilled')", [userId]),
        db_1.pool.query("SELECT kind FROM milestones WHERE user_id = $1", [userId]),
    ]);
    let streakCount = 0;
    try {
        const parsed = streakRaw
            ? JSON.parse(streakRaw)
            : null;
        streakCount = parsed?.count ?? 0;
    }
    catch {
        streakCount = 0;
    }
    const ctx = {
        completionsTotal: completions.rows[0].total,
        streakCount,
        bestScore: scores.rows[0].best ?? null,
        paidOrders: orders.rows[0].total,
    };
    const have = new Set(existing.rows.map((r) => r.kind));
    const achieved = [];
    for (const def of DEFINITIONS) {
        if (have.has(def.kind) || !def.check(ctx))
            continue;
        await db_1.pool.query(`INSERT INTO milestones (user_id, kind, label)
       VALUES ($1, $2, $3) ON CONFLICT (user_id, kind) DO NOTHING`, [userId, def.kind, def.label]);
        await db_1.pool.query(`INSERT INTO notifications (user_id, kind, title, body)
       VALUES ($1, 'milestone', $2, $3)`, [userId, `🏆 ${def.label}`, def.message(ctx)]);
        achieved.push(def.kind);
    }
    return achieved;
}
//# sourceMappingURL=milestones.js.map