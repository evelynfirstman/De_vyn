"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminContentRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
/**
 * Minimal content management for Phase 6 (full admin portal lands in Phase 9).
 * NOTE: no auth yet — lock these down when Better Auth + RBAC land (Phase 2b).
 */
exports.adminContentRouter = (0, express_1.Router)();
const articleSchema = zod_1.z.object({
    slug: zod_1.z
        .string()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9-]+$/),
    title: zod_1.z.string().min(1).max(200),
    excerpt: zod_1.z.string().default(""),
    body: zod_1.z.string().default(""),
    category: zod_1.z.string().min(1).default("recovery"),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
});
const videoSchema = zod_1.z.object({
    slug: zod_1.z
        .string()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9-]+$/),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().default(""),
    durationSec: zod_1.z.number().int().min(0).default(0),
    playbackUrl: zod_1.z.string().url().nullable().default(null),
    thumbnailUrl: zod_1.z.string().url().nullable().default(null),
    category: zod_1.z.string().min(1).default("recovery"),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
});
const ARTICLE_COLUMNS = `id, slug, title, excerpt, body, category,
  tags, created_at AS "createdAt"`;
const VIDEO_COLUMNS = `id, slug, title, description,
  duration_sec AS "durationSec", playback_url AS "playbackUrl",
  thumbnail_url AS "thumbnailUrl", category,
  tags, created_at AS "createdAt"`;
function crud(router, base, table, columns, schema, insert, updateSql, notFoundCode) {
    router.post(base, async (req, res, next) => {
        try {
            const body = schema.parse(req.body);
            const { rows } = await db_1.pool.query(`${insertSql(table)} RETURNING ${columns}`, insert(body));
            res.status(201).json({ data: rows[0] });
        }
        catch (err) {
            next(err);
        }
    });
    router.put(`${base}/:id`, async (req, res, next) => {
        try {
            const id = zod_1.z.coerce.number().int().positive().parse(req.params.id);
            const body = schema.parse(req.body);
            const { rows } = await db_1.pool.query(updateSql, [id, ...insert(body)]);
            if (rows.length === 0) {
                res.status(404).json({
                    error: { code: notFoundCode, message: "Not found" },
                });
                return;
            }
            res.json({ data: rows[0] });
        }
        catch (err) {
            next(err);
        }
    });
    router.delete(`${base}/:id`, async (req, res, next) => {
        try {
            const id = zod_1.z.coerce.number().int().positive().parse(req.params.id);
            const { rowCount } = await db_1.pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
            if (rowCount === 0) {
                res.status(404).json({
                    error: { code: notFoundCode, message: "Not found" },
                });
                return;
            }
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    });
}
function insertSql(table) {
    return table === "articles"
        ? `INSERT INTO articles (slug, title, excerpt, body, category, tags)
       VALUES ($1, $2, $3, $4, $5, $6)`
        : `INSERT INTO videos (slug, title, description, duration_sec, playback_url, thumbnail_url, category, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
}
crud(exports.adminContentRouter, "/admin/articles", "articles", ARTICLE_COLUMNS, articleSchema, (b) => {
    const a = b;
    return [a.slug, a.title, a.excerpt, a.body, a.category, a.tags];
}, `UPDATE articles SET slug = $2, title = $3, excerpt = $4, body = $5,
     category = $6, tags = $7 WHERE id = $1 RETURNING ${ARTICLE_COLUMNS}`, "ARTICLE_NOT_FOUND");
crud(exports.adminContentRouter, "/admin/videos", "videos", VIDEO_COLUMNS, videoSchema, (b) => {
    const v = b;
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
}, `UPDATE videos SET slug = $2, title = $3, description = $4, duration_sec = $5,
     playback_url = $6, thumbnail_url = $7, category = $8, tags = $9
     WHERE id = $1 RETURNING ${VIDEO_COLUMNS}`, "VIDEO_NOT_FOUND");
//# sourceMappingURL=adminContent.js.map