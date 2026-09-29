import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

/**
 * Minimal program management for Phase 5 (full admin portal lands in Phase 9).
 * NOTE: no auth yet — lock these down when Better Auth + RBAC land (Phase 2b).
 */
export const adminProgramsRouter = Router();

const stepSchema = z.object({
  name: z.string().min(1),
  seconds: z.number().int().positive(),
});

const programSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().default(""),
  level: z.string().min(1).default("all"),
  durationMin: z.number().int().positive(),
  steps: z.array(stepSchema).default([]),
  problemTags: z.array(z.string()).default([]),
});

const COLUMNS = `id, slug, title, description, level,
  duration_min AS "durationMin", steps,
  problem_tags AS "problemTags", created_at AS "createdAt"`;

adminProgramsRouter.post("/admin/programs", async (req, res, next) => {
  try {
    const body = programSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO programs (slug, title, description, level, duration_min, steps, problem_tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${COLUMNS}`,
      [
        body.slug,
        body.title,
        body.description,
        body.level,
        body.durationMin,
        JSON.stringify(body.steps),
        body.problemTags,
      ],
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

adminProgramsRouter.put("/admin/programs/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = programSchema.parse(req.body);
    const { rows } = await pool.query(
      `UPDATE programs
          SET slug = $2, title = $3, description = $4, level = $5,
              duration_min = $6, steps = $7, problem_tags = $8
        WHERE id = $1
        RETURNING ${COLUMNS}`,
      [
        id,
        body.slug,
        body.title,
        body.description,
        body.level,
        body.durationMin,
        JSON.stringify(body.steps),
        body.problemTags,
      ],
    );
    if (rows.length === 0) {
      res.status(404).json({
        error: { code: "PROGRAM_NOT_FOUND", message: "No such program" },
      });
      return;
    }
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

adminProgramsRouter.delete("/admin/programs/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const { rowCount } = await pool.query(
      "DELETE FROM programs WHERE id = $1",
      [id],
    );
    if (rowCount === 0) {
      res.status(404).json({
        error: { code: "PROGRAM_NOT_FOUND", message: "No such program" },
      });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
