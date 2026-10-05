"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
exports.notificationsRouter = (0, express_1.Router)();
exports.notificationsRouter.get("/notifications", async (req, res, next) => {
    try {
        const userId = zod_1.z.coerce.number().int().positive().parse(req.query.userId);
        const limit = zod_1.z.coerce
            .number()
            .int()
            .min(1)
            .max(100)
            .default(30)
            .parse(req.query.limit);
        const { rows } = await db_1.pool.query(`SELECT id, user_id AS "userId", kind, title, body, read,
              created_at AS "createdAt"
         FROM notifications WHERE user_id = $1
         ORDER BY read ASC, created_at DESC LIMIT $2`, [userId, limit]);
        res.json({ data: rows });
    }
    catch (err) {
        next(err);
    }
});
exports.notificationsRouter.post("/notifications/read", async (req, res, next) => {
    try {
        const body = zod_1.z
            .object({
            userId: zod_1.z.number().int().positive(),
            ids: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
        })
            .parse(req.body);
        if (body.ids === undefined) {
            await db_1.pool.query("UPDATE notifications SET read = true WHERE user_id = $1 AND read = false", [body.userId]);
        }
        else if (body.ids.length > 0) {
            await db_1.pool.query("UPDATE notifications SET read = true WHERE user_id = $1 AND id = ANY($2)", [body.userId, body.ids]);
        }
        res.json({ data: { ok: true } });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=notifications.js.map