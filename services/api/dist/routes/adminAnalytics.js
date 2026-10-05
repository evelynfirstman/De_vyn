"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAnalyticsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
exports.adminAnalyticsRouter = (0, express_1.Router)();
/** Acquisition → activation → habit → revenue funnel (Phase 9). */
exports.adminAnalyticsRouter.get("/admin/analytics/funnel", async (_req, res, next) => {
    try {
        const [users, profiles, assessments, plans, sessions7d, checkins7d, paid, repeat,] = await Promise.all([
            db_1.pool.query("SELECT COUNT(*)::int AS total FROM users"),
            db_1.pool.query("SELECT COUNT(*)::int AS total FROM profiles"),
            db_1.pool.query("SELECT COUNT(DISTINCT user_id)::int AS total FROM assessments"),
            db_1.pool.query("SELECT COUNT(*)::int AS total FROM recovery_plans"),
            db_1.pool.query("SELECT COUNT(DISTINCT user_id)::int AS total FROM session_completions WHERE completed_at >= (now() - INTERVAL '7 days')"),
            db_1.pool.query("SELECT COUNT(DISTINCT user_id)::int AS total FROM check_ins WHERE check_date >= (CURRENT_DATE - INTERVAL '7 days')"),
            db_1.pool.query("SELECT COUNT(*)::int AS total, COALESCE(SUM(amount_minor), 0)::int AS revenue FROM orders WHERE status IN ('paid', 'fulfilled')"),
            db_1.pool.query(`SELECT COUNT(*)::int AS total FROM (
             SELECT user_id FROM orders
             WHERE status IN ('paid', 'fulfilled')
             GROUP BY user_id HAVING COUNT(*) > 1
           ) repeat_buyers`),
        ]);
        res.json({
            data: {
                users: users.rows[0].total,
                withProfile: profiles.rows[0].total,
                assessed: assessments.rows[0].total,
                plans: plans.rows[0].total,
                activeSessions7d: sessions7d.rows[0].total,
                activeCheckins7d: checkins7d.rows[0].total,
                paidOrders: paid.rows[0].total,
                revenueMinor: paid.rows[0].revenue,
                repeatBuyers: repeat.rows[0].total,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
/** Weekly signup cohorts with 7-day check-in retention (Phase 9). */
exports.adminAnalyticsRouter.get("/admin/analytics/cohorts", async (req, res, next) => {
    try {
        const weeks = zod_1.z.coerce
            .number()
            .int()
            .min(1)
            .max(12)
            .default(4)
            .parse(req.query.weeks);
        const { rows } = await db_1.pool.query(`WITH cohorts AS (
         SELECT date_trunc('week', created_at)::date AS week, id
           FROM users
          WHERE created_at >= (date_trunc('week', now()) - (($1 - 1) || ' weeks')::interval)
       )
       SELECT c.week::text AS week,
              COUNT(DISTINCT c.id)::int AS signups,
              COUNT(DISTINCT ci.user_id)::int AS retained7d
         FROM cohorts c
         LEFT JOIN check_ins ci
           ON ci.user_id = c.id
          AND ci.check_date <= (c.week + INTERVAL '6 days')::date
         GROUP BY c.week ORDER BY c.week DESC`, [weeks]);
        res.json({ data: rows });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=adminAnalytics.js.map