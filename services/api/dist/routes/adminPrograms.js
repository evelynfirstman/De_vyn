"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProgramsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
/**
 * Minimal program management for Phase 5 (full admin portal lands in Phase 9).
 * NOTE: no auth yet — lock these down when Better Auth + RBAC land (Phase 2b).
 */
exports.adminProgramsRouter = (0, express_1.Router)();
const stepSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    seconds: zod_1.z.number().int().positive(),
});
const programSchema = zod_1.z.object({
    slug: zod_1.z
        .string()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9-]+$/),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().default(""),
    level: zod_1.z.string().min(1).default("all"),
    durationMin: zod_1.z.number().int().positive(),
    steps: zod_1.z.array(stepSchema).default([]),
    problemTags: zod_1.z.array(zod_1.z.string()).default([]),
});
const COLUMNS = `id, slug, title, description, level,
  duration_min AS "durationMin", steps,
  problem_tags AS "problemTags", created_at AS "createdAt"`;
exports.adminProgramsRouter.post("/admin/programs", async (req, res, next) => {
    try {
        const body = programSchema.parse(req.body);
        const { rows } = await db_1.pool.query(`INSERT INTO programs (slug, title, description, level, duration_min, steps, problem_tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${COLUMNS}`, [
            body.slug,
            body.title,
            body.description,
            body.level,
            body.durationMin,
            JSON.stringify(body.steps),
            body.problemTags,
        ]);
        res.status(201).json({ data: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.adminProgramsRouter.put("/admin/programs/:id", async (req, res, next) => {
    try {
        const id = zod_1.z.coerce.number().int().positive().parse(req.params.id);
        const body = programSchema.parse(req.body);
        const { rows } = await db_1.pool.query(`UPDATE programs
          SET slug = $2, title = $3, description = $4, level = $5,
              duration_min = $6, steps = $7, problem_tags = $8
        WHERE id = $1
        RETURNING ${COLUMNS}`, [
            id,
            body.slug,
            body.title,
            body.description,
            body.level,
            body.durationMin,
            JSON.stringify(body.steps),
            body.problemTags,
        ]);
        if (rows.length === 0) {
            res.status(404).json({
                error: { code: "PROGRAM_NOT_FOUND", message: "No such program" },
            });
            return;
        }
        res.json({ data: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.adminProgramsRouter.delete("/admin/programs/:id", async (req, res, next) => {
    try {
        const id = zod_1.z.coerce.number().int().positive().parse(req.params.id);
        const { rowCount } = await db_1.pool.query("DELETE FROM programs WHERE id = $1", [id]);
        if (rowCount === 0) {
            res.status(404).json({
                error: { code: "PROGRAM_NOT_FOUND", message: "No such program" },
            });
            return;
        }
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=adminPrograms.js.map