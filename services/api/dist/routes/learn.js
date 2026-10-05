"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.learnRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const pagination_1 = require("../pagination");
exports.learnRouter = (0, express_1.Router)();
const videoFilterSchema = zod_1.z.object({
    q: zod_1.z.string().min(1).optional(),
    category: zod_1.z.string().min(1).optional(),
});
const VIDEO_COLUMNS = `id, slug, title, description,
  duration_sec AS "durationSec", playback_url AS "playbackUrl",
  thumbnail_url AS "thumbnailUrl", category,
  tags, created_at AS "createdAt"`;
exports.learnRouter.get("/videos", async (req, res, next) => {
    try {
        const { page, pageSize } = (0, pagination_1.parsePagination)(req.query);
        const filters = videoFilterSchema.parse(req.query);
        const where = [];
        const params = [];
        if (filters.category !== undefined) {
            params.push(filters.category);
            where.push(`category = $${params.length}`);
        }
        if (filters.q !== undefined) {
            params.push(`%${filters.q}%`);
            where.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
        }
        const clause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
        const offset = (page - 1) * pageSize;
        const [rows, count] = await Promise.all([
            db_1.pool.query(`SELECT ${VIDEO_COLUMNS} FROM videos ${clause}
           ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, pageSize, offset]),
            db_1.pool.query(`SELECT COUNT(*)::int AS total FROM videos ${clause}`, params),
        ]);
        res.json((0, pagination_1.pageEnvelope)(rows.rows, count.rows[0].total, page, pageSize));
    }
    catch (err) {
        next(err);
    }
});
exports.learnRouter.get("/videos/:slug", async (req, res, next) => {
    try {
        const slug = zod_1.z.string().min(1).max(120).parse(req.params.slug);
        const { rows } = await db_1.pool.query(`SELECT ${VIDEO_COLUMNS} FROM videos WHERE slug = $1`, [slug]);
        if (rows.length === 0) {
            res.status(404).json({
                error: { code: "VIDEO_NOT_FOUND", message: "No such video" },
            });
            return;
        }
        res.json({ data: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
const bookmarkSchema = zod_1.z.object({
    userId: zod_1.z.number().int().positive(),
    kind: zod_1.z.enum(["article", "video", "product", "program"]),
    refId: zod_1.z.number().int().positive(),
});
async function refExists(kind, refId) {
    const table = kind === "article"
        ? "articles"
        : kind === "video"
            ? "videos"
            : kind === "product"
                ? "products"
                : "programs";
    const { rows } = await db_1.pool.query(`SELECT id FROM ${table} WHERE id = $1`, [
        refId,
    ]);
    return rows.length > 0;
}
exports.learnRouter.get("/bookmarks", async (req, res, next) => {
    try {
        const userId = zod_1.z.coerce.number().int().positive().parse(req.query.userId);
        const kind = req.query.kind === undefined
            ? undefined
            : zod_1.z
                .enum(["article", "video", "product", "program"])
                .parse(req.query.kind);
        const params = [userId];
        const clause = kind === undefined
            ? "WHERE b.user_id = $1"
            : "WHERE b.user_id = $1 AND b.kind = $2";
        if (kind !== undefined)
            params.push(kind);
        const { rows } = await db_1.pool.query(`SELECT b.id, b.user_id AS "userId", b.kind,
              b.ref_id AS "refId", b.created_at AS "createdAt",
              COALESCE(a.title, v.title, p.title, pr.title) AS title,
              COALESCE(a.slug, v.slug, p.sku, pr.slug) AS slug
         FROM bookmarks b
         LEFT JOIN articles a ON a.id = b.ref_id AND b.kind = 'article'
         LEFT JOIN videos v ON v.id = b.ref_id AND b.kind = 'video'
         LEFT JOIN products p ON p.id = b.ref_id AND b.kind = 'product'
         LEFT JOIN programs pr ON pr.id = b.ref_id AND b.kind = 'program'
        ${clause} ORDER BY b.created_at DESC`, params);
        res.json({ data: rows });
    }
    catch (err) {
        next(err);
    }
});
exports.learnRouter.post("/bookmarks", async (req, res, next) => {
    try {
        const body = bookmarkSchema.parse(req.body);
        if (!(await refExists(body.kind, body.refId))) {
            res.status(404).json({
                error: { code: "REF_NOT_FOUND", message: "No such item" },
            });
            return;
        }
        const { rows } = await db_1.pool.query(`INSERT INTO bookmarks (user_id, kind, ref_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, kind, ref_id) DO NOTHING
       RETURNING id, user_id AS "userId", kind,
                 ref_id AS "refId", created_at AS "createdAt"`, [body.userId, body.kind, body.refId]);
        res.status(201).json({ data: rows[0] ?? { ...body, bookmarked: true } });
    }
    catch (err) {
        next(err);
    }
});
exports.learnRouter.delete("/bookmarks", async (req, res, next) => {
    try {
        const body = bookmarkSchema.parse(req.body);
        await db_1.pool.query("DELETE FROM bookmarks WHERE user_id = $1 AND kind = $2 AND ref_id = $3", [body.userId, body.kind, body.refId]);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
/**
 * Rules-based recommendations (Phase 6): rank learn content by tag
 * overlap with the user's profile pain areas. ML ranking comes later.
 */
exports.learnRouter.get("/learn/related", async (req, res, next) => {
    try {
        const userId = zod_1.z.coerce.number().int().positive().parse(req.query.userId);
        const profile = await db_1.pool.query('SELECT pain_areas AS "painAreas" FROM profiles WHERE user_id = $1', [userId]);
        const painAreas = (profile.rows[0]?.painAreas ?? []);
        const limit = zod_1.z.coerce
            .number()
            .int()
            .min(1)
            .max(20)
            .default(10)
            .parse(req.query.limit);
        const [articles, videos] = await Promise.all([
            db_1.pool.query("SELECT id, slug, title, excerpt AS subtitle, category, tags FROM articles"),
            db_1.pool.query("SELECT id, slug, title, description AS subtitle, category, tags FROM videos"),
        ]);
        const overlap = (tags) => tags.filter((t) => painAreas.includes(t));
        const ranked = [
            ...articles.rows.map((r) => ({ kind: "article", ...r })),
            ...videos.rows.map((r) => ({ kind: "video", ...r })),
        ]
            .map((item) => ({
            kind: item.kind,
            id: item.id,
            slug: item.slug,
            title: item.title,
            subtitle: item.subtitle,
            category: item.category,
            matchedTags: overlap(item.tags),
        }))
            .sort((a, b) => b.matchedTags.length - a.matchedTags.length)
            .slice(0, limit);
        res.json({ data: ranked });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=learn.js.map