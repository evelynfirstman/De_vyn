"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
exports.accountRouter = (0, express_1.Router)();
/**
 * Delete a user's activity data (GDPR-style erasure, Phase 8).
 * Financial records (orders, payments, fulfillment) are retained —
 * money trails must survive account deletion.
 */
exports.accountRouter.delete("/users/:id/data", async (req, res, next) => {
    try {
        const userId = zod_1.z.coerce.number().int().positive().parse(req.params.id);
        const found = await db_1.pool.query("SELECT id FROM users WHERE id = $1", [
            userId,
        ]);
        if (found.rows.length === 0) {
            res
                .status(404)
                .json({ error: { code: "USER_NOT_FOUND", message: "No such user" } });
            return;
        }
        await db_1.pool.query("BEGIN");
        try {
            for (const table of [
                "notifications",
                "milestones",
                "goals",
                "bookmarks",
                "recovery_scores",
                "check_ins",
                "recovery_plans",
                "assessments",
                "session_completions",
                "profiles",
            ]) {
                await db_1.pool.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
            }
            await db_1.pool.query("COMMIT");
        }
        catch (err) {
            await db_1.pool.query("ROLLBACK");
            throw err;
        }
        res.json({ data: { deleted: true } });
    }
    catch (err) {
        next(err);
    }
});
/**
 * Export everything held about a user (GDPR-style access, Phase 12).
 * Financial records are included (read-only) with a retention note.
 */
exports.accountRouter.get("/users/:id/export", async (req, res, next) => {
    try {
        const userId = zod_1.z.coerce.number().int().positive().parse(req.params.id);
        const user = await db_1.pool.query('SELECT id, email, name, created_at AS "createdAt" FROM users WHERE id = $1', [userId]);
        if (user.rows.length === 0) {
            res
                .status(404)
                .json({ error: { code: "USER_NOT_FOUND", message: "No such user" } });
            return;
        }
        const tables = [
            "profiles",
            "assessments",
            "recovery_plans",
            "check_ins",
            "recovery_scores",
            "session_completions",
            "goals",
            "bookmarks",
            "milestones",
            "notifications",
            "notification_prefs",
            "subscriptions",
            "orders",
        ];
        const data = { user: user.rows[0] };
        for (const table of tables) {
            const rows = await db_1.pool.query(`SELECT * FROM ${table} WHERE user_id = $1 ORDER BY 1`, [userId]);
            data[table] = rows.rows;
        }
        const referrals = await db_1.pool.query("SELECT * FROM referrals WHERE referrer_user_id = $1 OR referred_user_id = $1 ORDER BY 1", [userId]);
        data.referrals = referrals.rows;
        const items = await db_1.pool.query(`SELECT i.* FROM order_items i JOIN orders o ON o.id = i.order_id
        WHERE o.user_id = $1 ORDER BY 1`, [userId]);
        data.order_items = items.rows;
        res.json({
            data: {
                ...data,
                _retentionNote: "Financial records (orders, payments, subscriptions) are retained for tax/audit purposes.",
            },
        });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=account.js.map