"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const logger_1 = require("../logger");
const milestones_1 = require("../milestones");
exports.sessionsRouter = (0, express_1.Router)();
const completeSchema = zod_1.z.object({
    userId: zod_1.z.number().int().positive(),
    programId: zod_1.z.number().int().positive(),
    durationSec: zod_1.z.number().int().min(0).default(0),
    completedAt: zod_1.z.string().datetime({ offset: true }).optional(),
    rating: zod_1.z.number().int().min(1).max(5).optional(),
    feedback: zod_1.z.string().max(2000).default(""),
});
exports.sessionsRouter.post("/sessions/complete", async (req, res, next) => {
    try {
        const body = completeSchema.parse(req.body);
        const { rows } = await db_1.pool.query(`INSERT INTO session_completions (user_id, program_id, duration_sec, completed_at, rating, feedback)
       VALUES ($1, $2, $3, COALESCE($4, now()), $5, $6)
       RETURNING id, user_id AS "userId", program_id AS "programId",
                 duration_sec AS "durationSec", completed_at AS "completedAt",
                 rating, feedback`, [
            body.userId,
            body.programId,
            body.durationSec,
            body.completedAt ?? null,
            body.rating ?? null,
            body.feedback,
        ]);
        try {
            await (0, milestones_1.evaluateMilestones)(body.userId);
        }
        catch (err) {
            logger_1.logger.warn({ err }, "milestone eval failed after completion");
        }
        res.status(201).json({ data: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.sessionsRouter.get("/sessions/history", async (req, res, next) => {
    try {
        const userId = zod_1.z.coerce.number().int().positive().parse(req.query.userId);
        const limit = zod_1.z.coerce
            .number()
            .int()
            .min(1)
            .max(100)
            .default(20)
            .parse(req.query.limit);
        const { rows } = await db_1.pool.query(`SELECT c.id, c.user_id AS "userId", c.program_id AS "programId",
              p.slug AS "programSlug", p.title AS "programTitle",
              c.duration_sec AS "durationSec", c.completed_at AS "completedAt"
         FROM session_completions c
         JOIN programs p ON p.id = c.program_id
        WHERE c.user_id = $1
        ORDER BY c.completed_at DESC LIMIT $2`, [userId, limit]);
        res.json({ data: rows });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=sessions.js.map