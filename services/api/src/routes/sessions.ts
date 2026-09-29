import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

export const sessionsRouter = Router();

const completeSchema = z.object({
  userId: z.number().int().positive(),
  programId: z.number().int().positive(),
  durationSec: z.number().int().min(0).default(0),
  completedAt: z.string().datetime({ offset: true }).optional(),
});

sessionsRouter.post("/sessions/complete", async (req, res, next) => {
  try {
    const body = completeSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO session_completions (user_id, program_id, duration_sec, completed_at)
       VALUES ($1, $2, $3, COALESCE($4, now()))
       RETURNING id, user_id AS "userId", program_id AS "programId",
                 duration_sec AS "durationSec", completed_at AS "completedAt"`,
      [body.userId, body.programId, body.durationSec, body.completedAt ?? null],
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

sessionsRouter.get("/sessions/history", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.query.userId);
    const limit = z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .parse(req.query.limit);
    const { rows } = await pool.query(
      `SELECT c.id, c.user_id AS "userId", c.program_id AS "programId",
              p.slug AS "programSlug", p.title AS "programTitle",
              c.duration_sec AS "durationSec", c.completed_at AS "completedAt"
         FROM session_completions c
         JOIN programs p ON p.id = c.program_id
        WHERE c.user_id = $1
        ORDER BY c.completed_at DESC LIMIT $2`,
      [userId, limit],
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});
