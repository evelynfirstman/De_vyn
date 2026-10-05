"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tipsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
exports.tipsRouter = (0, express_1.Router)();
const FALLBACK_TIPS = [
    {
        title: "Move every hour",
        body: "Taking a two-minute movement break every hour can help reduce stiffness from prolonged sitting.",
    },
    {
        title: "Hydrate to recover",
        body: "Muscles recover better hydrated — keep water at your desk and sip through the day.",
    },
    {
        title: "Shoulders down",
        body: "Unclench your jaw, drop your shoulders away from your ears, and take one slow breath.",
    },
    {
        title: "Sleep is a session",
        body: "Most tissue repair happens during deep sleep — a consistent bedtime beats a long weekend lie-in.",
    },
    {
        title: "Neck check",
        body: "Tuck your chin gently, hold five seconds, repeat five times. Your neck will thank you.",
    },
];
/** Deterministic daily tip: rotates approved KB docs, falls back to built-ins. */
exports.tipsRouter.get("/daily-tip", async (req, res, next) => {
    try {
        const date = req.query.date === undefined
            ? new Date().toISOString().slice(0, 10)
            : zod_1.z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/)
                .parse(req.query.date);
        const dayOfYear = Math.floor(new Date(`${date}T12:00:00Z`).getTime() / 86_400_000);
        const { rows } = await db_1.pool.query("SELECT title, body, source FROM kb_documents WHERE status = 'approved' ORDER BY id ASC");
        if (rows.length > 0) {
            const doc = rows[dayOfYear % rows.length];
            res.json({
                data: { title: doc.title, body: doc.body, source: doc.source },
            });
            return;
        }
        const tip = FALLBACK_TIPS[dayOfYear % FALLBACK_TIPS.length];
        res.json({ data: { ...tip, source: "vyn basics" } });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=tips.js.map