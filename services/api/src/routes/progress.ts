import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { displayStreak } from "../streak";
import { readStreak } from "./home";

export const progressRouter = Router();

progressRouter.get("/progress", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.query.userId);
    const days = z.coerce
      .number()
      .int()
      .min(1)
      .max(90)
      .default(30)
      .parse(req.query.days);
    const today = new Date().toISOString().slice(0, 10);

    const [scores, completions, milestones] = await Promise.all([
      pool.query(
        `SELECT check_date::text AS "date", score, band
           FROM recovery_scores WHERE user_id = $1
           ORDER BY check_date DESC LIMIT $2`,
        [userId, days],
      ),
      pool.query(
        `SELECT completed_at::date::text AS "date", COUNT(*)::int AS count
           FROM session_completions
          WHERE user_id = $1 AND completed_at >= (now() - ($2 || ' days')::interval)
          GROUP BY 1 ORDER BY 1 ASC`,
        [userId, String(days)],
      ),
      pool.query(
        `SELECT kind, label, achieved_at AS "achievedAt"
           FROM milestones WHERE user_id = $1 ORDER BY achieved_at DESC`,
        [userId],
      ),
    ]);

    const state = await readStreak(userId, today);

    res.json({
      data: {
        scores: [...scores.rows].reverse(),
        completionsByDay: completions.rows,
        streak: {
          count: displayStreak(state, today),
          lastDate: state?.lastDate ?? null,
        },
        milestones: milestones.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});
