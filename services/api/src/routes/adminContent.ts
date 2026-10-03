import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

/**
 * Minimal content management for Phase 6 (full admin portal lands in Phase 9).
 * NOTE: no auth yet — lock these down when Better Auth + RBAC land (Phase 2b).
 */
export const adminContentRouter = Router();

const articleSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  excerpt: z.string().default(""),
  body: z.string().default(""),
  category: z.string().min(1).default("recovery"),
  tags: z.array(z.string()).default([]),
});

const videoSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().default(""),
  durationSec: z.number().int().min(0).default(0),
  playbackUrl: z.string().url().nullable().default(null),
  thumbnailUrl: z.string().url().nullable().default(null),
  category: z.string().min(1).default("recovery"),
  tags: z.array(z.string()).default([]),
});

const ARTICLE_COLUMNS = `id, slug, title, excerpt, body, category,
  tags, created_at AS "createdAt"`;
const VIDEO_COLUMNS = `id, slug, title, description,
  duration_sec AS "durationSec", playback_url AS "playbackUrl",
  thumbnail_url AS "thumbnailUrl", category,
  tags, created_at AS "createdAt"`;

type ContentInput = z.infer<typeof articleSchema> | z.infer<typeof videoSchema>;

function crud(
  router: Router,
  base: string,
  table: "articles" | "videos",
  columns: string,
  schema: z.ZodTypeAny,
  insert: (b: ContentInput) => (string | number | string[] | null)[],
  updateSql: string,
  notFoundCode: string,
) {
  router.post(base, async (req, res, next) => {
    try {
      const body = schema.parse(req.body);
      const { rows } = await pool.query(
        `${insertSql(table)} RETURNING ${columns}`,
        insert(body),
      );
      res.status(201).json({ data: rows[0] });
    } catch (err) {
      next(err);
    }
  });

  router.put(`${base}/:id`, async (req, res, next) => {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const body = schema.parse(req.body);
      const { rows } = await pool.query(updateSql, [id, ...insert(body)]);
      if (rows.length === 0) {
        res.status(404).json({
          error: { code: notFoundCode, message: "Not found" },
        });
        return;
      }
      res.json({ data: rows[0] });
    } catch (err) {
      next(err);
    }
  });

  router.delete(`${base}/:id`, async (req, res, next) => {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const { rowCount } = await pool.query(
        `DELETE FROM ${table} WHERE id = $1`,
        [id],
      );
      if (rowCount === 0) {
        res.status(404).json({
          error: { code: notFoundCode, message: "Not found" },
        });
        return;
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });
}

function insertSql(table: "articles" | "videos"): string {
  return table === "articles"
    ? `INSERT INTO articles (slug, title, excerpt, body, category, tags)
       VALUES ($1, $2, $3, $4, $5, $6)`
    : `INSERT INTO videos (slug, title, description, duration_sec, playback_url, thumbnail_url, category, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
}

crud(
  adminContentRouter,
  "/admin/articles",
  "articles",
  ARTICLE_COLUMNS,
  articleSchema,
  (b) => {
    const a = b as z.infer<typeof articleSchema>;
    return [a.slug, a.title, a.excerpt, a.body, a.category, a.tags];
  },
  `UPDATE articles SET slug = $2, title = $3, excerpt = $4, body = $5,
     category = $6, tags = $7 WHERE id = $1 RETURNING ${ARTICLE_COLUMNS}`,
  "ARTICLE_NOT_FOUND",
);

crud(
  adminContentRouter,
  "/admin/videos",
  "videos",
  VIDEO_COLUMNS,
  videoSchema,
  (b) => {
    const v = b as z.infer<typeof videoSchema>;
    return [
      v.slug,
      v.title,
      v.description,
      v.durationSec,
      v.playbackUrl,
      v.thumbnailUrl,
      v.category,
      v.tags,
    ];
  },
  `UPDATE videos SET slug = $2, title = $3, description = $4, duration_sec = $5,
     playback_url = $6, thumbnail_url = $7, category = $8, tags = $9
     WHERE id = $1 RETURNING ${VIDEO_COLUMNS}`,
  "VIDEO_NOT_FOUND",
);
