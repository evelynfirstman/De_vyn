"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const pagination_1 = require("../pagination");
exports.catalogRouter = (0, express_1.Router)();
async function list(table, page, pageSize) {
    const offset = (page - 1) * pageSize;
    const [rows, count] = await Promise.all([
        db_1.pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [pageSize, offset]),
        db_1.pool.query(`SELECT COUNT(*)::int AS total FROM ${table}`),
    ]);
    return (0, pagination_1.pageEnvelope)(rows.rows, count.rows[0].total, page, pageSize);
}
const programFilterSchema = zod_1.z.object({
    level: zod_1.z.string().min(1).optional(),
    maxDurationMin: zod_1.z.coerce.number().int().positive().optional(),
    tags: zod_1.z
        .string()
        .min(1)
        .optional()
        .transform((s) => s === undefined
        ? []
        : s
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)),
});
exports.catalogRouter.get("/programs", async (req, res, next) => {
    try {
        const { page, pageSize } = (0, pagination_1.parsePagination)(req.query);
        const filters = programFilterSchema.parse(req.query);
        const where = [];
        const params = [];
        if (filters.level !== undefined) {
            params.push(filters.level);
            where.push(`level = $${params.length}`);
        }
        if (filters.maxDurationMin !== undefined) {
            params.push(filters.maxDurationMin);
            where.push(`duration_min <= $${params.length}`);
        }
        if (filters.tags.length > 0) {
            params.push(filters.tags);
            where.push(`problem_tags && $${params.length}`);
        }
        const clause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
        const offset = (page - 1) * pageSize;
        const [rows, count] = await Promise.all([
            db_1.pool.query(`SELECT id, slug, title, description, level, duration_min,
                steps, equipment, problem_tags AS "problemTags", created_at AS "createdAt"
           FROM programs ${clause}
           ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, pageSize, offset]),
            db_1.pool.query(`SELECT COUNT(*)::int AS total FROM programs ${clause}`, params),
        ]);
        res.json((0, pagination_1.pageEnvelope)(rows.rows, count.rows[0].total, page, pageSize));
    }
    catch (err) {
        next(err);
    }
});
exports.catalogRouter.get("/programs/:slug", async (req, res, next) => {
    try {
        const slug = zod_1.z.string().min(1).max(120).parse(req.params.slug);
        const { rows } = await db_1.pool.query(`SELECT id, slug, title, description, level, duration_min,
              steps, equipment, problem_tags AS "problemTags", created_at AS "createdAt"
         FROM programs WHERE slug = $1`, [slug]);
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
const textFilterSchema = zod_1.z.object({
    q: zod_1.z.string().min(1).optional(),
    category: zod_1.z.string().min(1).optional(),
});
exports.catalogRouter.get("/articles", async (req, res, next) => {
    try {
        const { page, pageSize } = (0, pagination_1.parsePagination)(req.query);
        const filters = textFilterSchema.parse(req.query);
        const where = [];
        const params = [];
        if (filters.category !== undefined) {
            params.push(filters.category);
            where.push(`category = $${params.length}`);
        }
        if (filters.q !== undefined) {
            params.push(`%${filters.q}%`);
            where.push(`(title ILIKE $${params.length} OR excerpt ILIKE $${params.length})`);
        }
        const clause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
        const offset = (page - 1) * pageSize;
        const [rows, count] = await Promise.all([
            db_1.pool.query(`SELECT id, slug, title, excerpt, body, category,
                tags, created_at AS "createdAt"
           FROM articles ${clause}
           ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, pageSize, offset]),
            db_1.pool.query(`SELECT COUNT(*)::int AS total FROM articles ${clause}`, params),
        ]);
        res.json((0, pagination_1.pageEnvelope)(rows.rows, count.rows[0].total, page, pageSize));
    }
    catch (err) {
        next(err);
    }
});
exports.catalogRouter.get("/articles/:slug", async (req, res, next) => {
    try {
        const slug = zod_1.z.string().min(1).max(120).parse(req.params.slug);
        const { rows } = await db_1.pool.query(`SELECT id, slug, title, excerpt, body, category,
              tags, created_at AS "createdAt"
         FROM articles WHERE slug = $1`, [slug]);
        if (rows.length === 0) {
            res.status(404).json({
                error: { code: "ARTICLE_NOT_FOUND", message: "No such article" },
            });
            return;
        }
        res.json({ data: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.catalogRouter.get("/products", async (req, res, next) => {
    try {
        const { page, pageSize } = (0, pagination_1.parsePagination)(req.query);
        res.json(await list("products", page, pageSize));
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=catalog.js.map