"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
exports.activeWeights = activeWeights;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const score_1 = require("../score");
const explain_1 = require("../explain");
exports.aiRouter = (0, express_1.Router)();
const weightsSchema = zod_1.z.object({
    base: zod_1.z.number().min(0).max(100),
    sleepHigh: zod_1.z.number().min(0).max(50),
    sleepMid: zod_1.z.number().min(0).max(50),
    sorenessPer: zod_1.z.number().min(0).max(10),
    stressPer: zod_1.z.number().min(0).max(10),
    completionPer: zod_1.z.number().min(0).max(10),
    completionCap: zod_1.z.number().min(0).max(50),
    highAt: zod_1.z.number().min(0).max(100),
    midAt: zod_1.z.number().min(0).max(100),
    streakBonusCap: zod_1.z.number().min(0).max(20),
});
async function activeWeights() {
    const { rows } = await db_1.pool.query("SELECT weights FROM score_configs WHERE is_active = true ORDER BY id DESC LIMIT 1");
    if (rows.length === 0)
        return { version: "v1", weights: score_1.V1_WEIGHTS };
    const weights = rows[0].weights;
    const parsed = weightsSchema.safeParse(weights);
    if (!parsed.success)
        return { version: "v1", weights: score_1.V1_WEIGHTS };
    const custom = JSON.stringify(parsed.data) !== JSON.stringify(score_1.V1_WEIGHTS);
    return { version: custom ? "v2" : "v1", weights: parsed.data };
}
exports.aiRouter.get("/admin/score-config", async (_req, res, next) => {
    try {
        const { rows } = await db_1.pool.query(`SELECT id, name, weights, is_active AS "isActive",
              created_at AS "createdAt"
         FROM score_configs ORDER BY id DESC`);
        res.json({ data: rows });
    }
    catch (err) {
        next(err);
    }
});
exports.aiRouter.put("/admin/score-config", async (req, res, next) => {
    try {
        const body = zod_1.z
            .object({
            name: zod_1.z.string().min(1).default("custom"),
            weights: weightsSchema,
        })
            .parse(req.body);
        await db_1.pool.query("UPDATE score_configs SET is_active = false");
        const { rows } = await db_1.pool.query(`INSERT INTO score_configs (name, weights, is_active)
       VALUES ($1, $2, true)
       RETURNING id, name, weights, is_active AS "isActive"`, [body.name, JSON.stringify(body.weights)]);
        res.status(201).json({ data: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
/**
 * Calibration analysis (Phase 10): compare score trajectories of users
 * with vs without weekly completions, and suggest a completion weight.
 * Advisory only — applying is a manual PUT above.
 */
exports.aiRouter.post("/admin/score-config/calibrate", async (_req, res, next) => {
    try {
        const { rows } = await db_1.pool.query(`WITH first_last AS (
         SELECT user_id,
                MIN(check_date) AS first_date, MAX(check_date) AS last_date,
                COUNT(*) AS n
           FROM recovery_scores GROUP BY user_id HAVING COUNT(*) >= 2
       ),
       deltas AS (
         SELECT f.user_id,
                (SELECT score FROM recovery_scores s WHERE s.user_id = f.user_id AND s.check_date = f.last_date) -
                (SELECT score FROM recovery_scores s WHERE s.user_id = f.user_id AND s.check_date = f.first_date) AS delta,
                (SELECT COUNT(*) FROM session_completions c
                  WHERE c.user_id = f.user_id
                    AND c.completed_at >= f.first_date::timestamptz
                    AND c.completed_at < (f.last_date + INTERVAL '1 day')::timestamptz) AS completions
           FROM first_last f
       )
       SELECT COUNT(*)::int AS users,
              AVG(delta)::float AS avg_delta_all,
              AVG(delta) FILTER (WHERE completions > 0)::float AS avg_delta_active,
              AVG(delta) FILTER (WHERE completions = 0)::float AS avg_delta_idle,
              AVG(completions)::float AS avg_completions
         FROM deltas`);
        const stats = rows[0];
        const gap = stats.avg_delta_active !== null && stats.avg_delta_idle !== null
            ? stats.avg_delta_active - stats.avg_delta_idle
            : null;
        const avgComp = stats.avg_completions ?? 0;
        const suggestedCompletionPer = gap === null || avgComp <= 0
            ? null
            : Math.max(0, Math.min(10, Math.round((gap / Math.max(1, avgComp)) * 10) / 10));
        res.json({
            data: {
                observations: stats,
                suggestedWeights: suggestedCompletionPer === null
                    ? null
                    : { ...score_1.V1_WEIGHTS, completionPer: suggestedCompletionPer },
                note: stats.users < 10
                    ? "Sample too small (<10 users with 2+ scores) — treat as directional only."
                    : "Review before applying via PUT /v1/admin/score-config.",
            },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.aiRouter.get("/kb/search", async (req, res, next) => {
    try {
        const q = zod_1.z.string().min(1).max(200).parse(req.query.q);
        const limit = zod_1.z.coerce
            .number()
            .int()
            .min(1)
            .max(20)
            .default(10)
            .parse(req.query.limit);
        const { rows } = await db_1.pool.query(`SELECT id, title, body, source,
              ts_rank_cd(search_vector, plainto_tsquery('english', $1)) AS rank
         FROM kb_documents
        WHERE status = 'approved'
          AND search_vector @@ plainto_tsquery('english', $1)
        ORDER BY rank DESC LIMIT $2`, [q, limit]);
        res.json({ data: rows });
    }
    catch (err) {
        next(err);
    }
});
exports.aiRouter.get("/plans/:id/explanation", async (req, res, next) => {
    try {
        const id = zod_1.z.coerce.number().int().positive().parse(req.params.id);
        const planRes = await db_1.pool.query('SELECT id, user_id AS "userId", items, rationale FROM recovery_plans WHERE id = $1', [id]);
        if (planRes.rows.length === 0) {
            res
                .status(404)
                .json({ error: { code: "PLAN_NOT_FOUND", message: "No such plan" } });
            return;
        }
        const plan = planRes.rows[0];
        const profile = await db_1.pool.query('SELECT pain_areas AS "painAreas" FROM profiles WHERE user_id = $1', [plan.userId]);
        const pains = (profile.rows[0]?.painAreas ?? []);
        const docs = pains.length > 0
            ? (await db_1.pool.query(`SELECT title, source,
                      ts_rank_cd(search_vector, plainto_tsquery('english', $1)) AS rank
                 FROM kb_documents
                WHERE status = 'approved'
                  AND search_vector @@ plainto_tsquery('english', $1)
                ORDER BY rank DESC LIMIT 3`, [pains.join(" ")])).rows.map((r) => ({
                title: r.title,
                source: r.source,
            }))
            : [];
        res.json({
            data: {
                planId: id,
                rationale: plan.rationale,
                ...(0, explain_1.buildExplanation)({
                    itemCount: plan.items.length,
                    painAreas: pains,
                    docs,
                }),
            },
        });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=ai.js.map