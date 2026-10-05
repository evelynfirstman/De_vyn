"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLinkRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
exports.authLinkRouter = (0, express_1.Router)();
/**
 * Link a Better Auth identity to an app row (Phase 2b).
 * Called once after sign-up/sign-in; all journey endpoints keep
 * using the numeric app user id. No auth required (email is the key).
 */
exports.authLinkRouter.post("/auth/link", async (req, res, next) => {
    try {
        const body = zod_1.z
            .object({
            email: zod_1.z.string().email(),
            name: zod_1.z.string().min(1).max(120).default(""),
        })
            .parse(req.body);
        const email = body.email.toLowerCase();
        const existing = await db_1.pool.query("SELECT id FROM users WHERE lower(email) = $1", [email]);
        if (existing.rows.length > 0) {
            res.json({ data: { appUserId: existing.rows[0].id } });
            return;
        }
        const created = await db_1.pool.query("INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id", [email, body.name]);
        res.status(201).json({ data: { appUserId: created.rows[0].id } });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=authLink.js.map