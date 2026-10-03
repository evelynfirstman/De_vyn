import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { pageEnvelope, parsePagination } from "../pagination";

export const catalogRouter = Router();

type CatalogTable = "products";

async function list(table: CatalogTable, page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM ${table}`),
  ]);
  return pageEnvelope(rows.rows, count.rows[0].total as number, page, pageSize);
}

const programFilterSchema = z.object({
  level: z.string().min(1).optional(),
  maxDurationMin: z.coerce.number().int().positive().optional(),
  tags: z
    .string()
    .min(1)
    .optional()
    .transform((s) =>
      s === undefined
        ? []
        : s
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
    ),
});

catalogRouter.get("/programs", async (req, res, next) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const filters = programFilterSchema.parse(req.query);
    const where: string[] = [];
    const params: (string | number | string[])[] = [];
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
      pool.query(
        `SELECT id, slug, title, description, level, duration_min,
                steps, equipment, problem_tags AS "problemTags", created_at AS "createdAt"
           FROM programs ${clause}
           ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, offset],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM programs ${clause}`,
        params,
      ),
    ]);
    res.json(
      pageEnvelope(rows.rows, count.rows[0].total as number, page, pageSize),
    );
  } catch (err) {
    next(err);
  }
});

catalogRouter.get("/programs/:slug", async (req, res, next) => {
  try {
    const slug = z.string().min(1).max(120).parse(req.params.slug);
    const { rows } = await pool.query(
      `SELECT id, slug, title, description, level, duration_min,
              steps, equipment, problem_tags AS "problemTags", created_at AS "createdAt"
         FROM programs WHERE slug = $1`,
      [slug],
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

const textFilterSchema = z.object({
  q: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
});

catalogRouter.get("/articles", async (req, res, next) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const filters = textFilterSchema.parse(req.query);
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.category !== undefined) {
      params.push(filters.category);
      where.push(`category = $${params.length}`);
    }
    if (filters.q !== undefined) {
      params.push(`%${filters.q}%`);
      where.push(
        `(title ILIKE $${params.length} OR excerpt ILIKE $${params.length})`,
      );
    }
    const clause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const offset = (page - 1) * pageSize;
    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT id, slug, title, excerpt, body, category,
                tags, created_at AS "createdAt"
           FROM articles ${clause}
           ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, offset],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM articles ${clause}`,
        params,
      ),
    ]);
    res.json(
      pageEnvelope(rows.rows, count.rows[0].total as number, page, pageSize),
    );
  } catch (err) {
    next(err);
  }
});

catalogRouter.get("/articles/:slug", async (req, res, next) => {
  try {
    const slug = z.string().min(1).max(120).parse(req.params.slug);
    const { rows } = await pool.query(
      `SELECT id, slug, title, excerpt, body, category,
              tags, created_at AS "createdAt"
         FROM articles WHERE slug = $1`,
      [slug],
    );
    if (rows.length === 0) {
      res.status(404).json({
        error: { code: "ARTICLE_NOT_FOUND", message: "No such article" },
      });
      return;
    }
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

catalogRouter.get("/products", async (req, res, next) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    res.json(await list("products", page, pageSize));
  } catch (err) {
    next(err);
  }
});
