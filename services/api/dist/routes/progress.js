"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const streak_1 = require("../streak");
const home_1 = require("./home");
exports.progressRouter = (0, express_1.Router)();
exports.progressRouter.get("/progress", async (req, res, next) => {
    try {
        const userId = zod_1.z.coerce.number().int().positive().parse(req.query.userId);
        const days = zod_1.z.coerce
            .number()
            .int()
            .min(1)
            .max(90)
            .default(30)
            .parse(req.query.days);
        const today = new Date().toISOString().slice(0, 10);
        const [scores, completions, milestones] = await Promise.all([
            db_1.pool.query(`SELECT check_date::text AS "date", score, band
           FROM recovery_scores WHERE user_id = $1
           ORDER BY check_date DESC LIMIT $2`, [userId, days]),
            db_1.pool.query(`SELECT completed_at::date::text AS "date", COUNT(*)::int AS count
           FROM session_completions
          WHERE user_id = $1 AND completed_at >= (now() - ($2 || ' days')::interval)
          GROUP BY 1 ORDER BY 1 ASC`, [userId, String(days)]),
            db_1.pool.query(`SELECT kind, label, achieved_at AS "achievedAt"
           FROM milestones WHERE user_id = $1 ORDER BY achieved_at DESC`, [userId]),
        ]);
        const state = await (0, home_1.readStreak)(userId, today);
        res.json({
            data: {
                scores: [...scores.rows].reverse(),
                completionsByDay: completions.rows,
                streak: {
                    count: (0, streak_1.displayStreak)(state, today),
                    lastDate: state?.lastDate ?? null,
                },
                milestones: milestones.rows,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=progress.js.map