import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

export const goalsRouter = Router();

const ownerSchema = z.object({ userId: z.number().int().positive() });

const createSchema = ownerSchema.extend({
  title: z.string().min(1).max(200),
  targetPerWeek: z.number().int().min(1).max(14).default(3),
});

const updateSchema = ownerSchema.extend({
  title: z.string().min(1).max(200).optional(),
  targetPerWeek: z.number().int().min(1).max(14).optional(),
  done: z.boolean().optional(),
});

const GOAL_COLUMNS = `id, user_id AS "userId", title,
  target_per_week AS "targetPerWeek", done, created_at AS "createdAt"`;

goalsRouter.get("/goals", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.query.userId);
    const { rows } = await pool.query(
      `SELECT ${GOAL_COLUMNS} FROM goals WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId],
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

goalsRouter.post("/goals", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO goals (user_id, title, target_per_week)
       VALUES ($1, $2, $3) RETURNING ${GOAL_COLUMNS}`,
      [body.userId, body.title, body.targetPerWeek],
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

goalsRouter.patch("/goals/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = updateSchema.parse(req.body);
    const sets: string[] = [];
    const params: (number | string | boolean)[] = [id, body.userId];
    if (body.title !== undefined) {
      params.push(body.title);
      sets.push(`title = $${params.length}`);
    }
    if (body.targetPerWeek !== undefined) {
      params.push(body.targetPerWeek);
      sets.push(`target_per_week = $${params.length}`);
    }
    if (body.done !== undefined) {
      params.push(body.done);
      sets.push(`done = $${params.length}`);
    }
    if (sets.length === 0) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Nothing to update" },
      });
      return;
    }
    const { rows } = await pool.query(
      `UPDATE goals SET ${sets.join(", ")} WHERE id = $1 AND user_id = $2 RETURNING ${GOAL_COLUMNS}`,
      params,
    );
    if (rows.length === 0) {
      res
        .status(404)
        .json({ error: { code: "GOAL_NOT_FOUND", message: "No such goal" } });
      return;
    }
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

goalsRouter.delete("/goals/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const userId = z.coerce.number().int().positive().parse(req.query.userId);
    const { rowCount } = await pool.query(
      "DELETE FROM goals WHERE id = $1 AND user_id = $2",
      [id, userId],
    );
    if (rowCount === 0) {
      res
        .status(404)
        .json({ error: { code: "GOAL_NOT_FOUND", message: "No such goal" } });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
