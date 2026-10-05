"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coachRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const env_1 = require("../env");
const coach_1 = require("../coach");
exports.coachRouter = (0, express_1.Router)();
const chatSchema = zod_1.z.object({
    userId: zod_1.z.number().int().positive(),
    message: zod_1.z.string().min(1).max(2000),
    history: zod_1.z
        .array(zod_1.z.object({
        role: zod_1.z.enum(["user", "assistant"]),
        content: zod_1.z.string().min(1).max(2000),
    }))
        .max(20)
        .default([]),
});
exports.coachRouter.post("/coach/chat", async (req, res, next) => {
    try {
        if (!env_1.env.GROQ_API_KEY) {
            res.status(503).json({
                error: { code: "AI_UNCONFIGURED", message: "Coach API key not set" },
            });
            return;
        }
        const body = chatSchema.parse(req.body);
        const kbQuery = (0, coach_1.keywordQuery)(body.message);
        const [profileRes, planRes, scoresRes, kbRes] = await Promise.all([
            db_1.pool.query(`SELECT name, goals, pain_areas AS "painAreas",
                minutes_per_session AS "minutesPerSession",
                days_per_week AS "daysPerWeek"
           FROM users u LEFT JOIN profiles p ON p.user_id = u.id
          WHERE u.id = $1`, [body.userId]),
            db_1.pool.query("SELECT items, rationale FROM recovery_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [body.userId]),
            db_1.pool.query("SELECT check_date::text AS date, score, band FROM recovery_scores WHERE user_id = $1 ORDER BY check_date DESC LIMIT 5", [body.userId]),
            kbQuery === null
                ? Promise.resolve({ rows: [] })
                : db_1.pool.query(`SELECT title, body, source,
                    ts_rank_cd(search_vector, to_tsquery('english', $1)) AS rank
               FROM kb_documents
              WHERE status = 'approved'
                AND search_vector @@ to_tsquery('english', $1)
              ORDER BY rank DESC LIMIT 3`, [kbQuery]),
        ]);
        if (profileRes.rows.length === 0) {
            res.status(404).json({
                error: { code: "USER_NOT_FOUND", message: "No such user" },
            });
            return;
        }
        const profile = profileRes.rows[0];
        const plan = planRes.rows[0];
        const ctx = {
            name: profile.name ?? "",
            goals: profile.goals ?? [],
            painAreas: profile.painAreas ?? [],
            minutesPerSession: profile.minutesPerSession ?? 15,
            daysPerWeek: profile.daysPerWeek ?? 3,
            planSummary: plan
                ? plan.items.map((i) => `${i.day}: ${i.title}`).join("; ")
                : "",
            recentScores: scoresRes.rows,
            kbExcerpts: kbRes.rows,
        };
        const history = body.history.map((h) => ({
            role: h.role,
            content: h.content,
        }));
        const reply = await (0, coach_1.callGroq)(env_1.env.GROQ_API_KEY, env_1.env.GROQ_MODEL, (0, coach_1.buildCoachMessages)(ctx, history, body.message));
        const flagged = (0, coach_1.scanReply)(reply);
        res.json({
            data: {
                reply: flagged.length > 0 ? coach_1.COACH_FALLBACK : reply,
                flagged: flagged.length > 0,
                model: env_1.env.GROQ_MODEL,
                sources: ctx.kbExcerpts.map((d) => ({
                    title: d.title,
                    source: d.source,
                })),
            },
        });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=coach.js.map