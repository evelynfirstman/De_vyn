import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

export const notificationsRouter = Router();

notificationsRouter.get("/notifications", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.query.userId);
    const limit = z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(30)
      .parse(req.query.limit);
    const { rows } = await pool.query(
      `SELECT id, user_id AS "userId", kind, title, body, read,
              created_at AS "createdAt"
         FROM notifications WHERE user_id = $1
         ORDER BY read ASC, created_at DESC LIMIT $2`,
      [userId, limit],
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post("/notifications/read", async (req, res, next) => {
  try {
    const body = z
      .object({
        userId: z.number().int().positive(),
        ids: z.array(z.number().int().positive()).optional(),
      })
      .parse(req.body);
    if (body.ids === undefined) {
      await pool.query(
        "UPDATE notifications SET read = true WHERE user_id = $1 AND read = false",
        [body.userId],
      );
    } else if (body.ids.length > 0) {
      await pool.query(
        "UPDATE notifications SET read = true WHERE user_id = $1 AND id = ANY($2)",
        [body.userId, body.ids],
      );
    }
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});
