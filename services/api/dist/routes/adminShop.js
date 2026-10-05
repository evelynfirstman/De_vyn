"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminShopRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const env_1 = require("../env");
exports.adminShopRouter = (0, express_1.Router)();
const productSchema = zod_1.z.object({
    sku: zod_1.z
        .string()
        .min(1)
        .max(60)
        .regex(/^[A-Za-z0-9-]+$/),
    title: zod_1.z.string().min(1).max(200),
    amountMinor: zod_1.z.number().int().min(0),
    currency: zod_1.z.string().min(1).default("NGN"),
    isBundle: zod_1.z.boolean().default(false),
    problemTags: zod_1.z.array(zod_1.z.string()).default([]),
});
const PRODUCT_COLUMNS = `id, sku, title, amount_minor AS "amountMinor",
  currency, is_bundle AS "isBundle", problem_tags AS "problemTags",
  created_at AS "createdAt"`;
exports.adminShopRouter.get("/admin/products", async (_req, res, next) => {
    try {
        const { rows } = await db_1.pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY id ASC`);
        res.json({ data: rows });
    }
    catch (err) {
        next(err);
    }
});
exports.adminShopRouter.post("/admin/products", async (req, res, next) => {
    try {
        const body = productSchema.parse(req.body);
        const { rows } = await db_1.pool.query(`INSERT INTO products (sku, title, amount_minor, currency, is_bundle, problem_tags)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${PRODUCT_COLUMNS}`, [
            body.sku,
            body.title,
            body.amountMinor,
            body.currency,
            body.isBundle,
            body.problemTags,
        ]);
        res.status(201).json({ data: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.adminShopRouter.put("/admin/products/:id", async (req, res, next) => {
    try {
        const id = zod_1.z.coerce.number().int().positive().parse(req.params.id);
        const body = productSchema.parse(req.body);
        const { rows } = await db_1.pool.query(`UPDATE products SET sku = $2, title = $3, amount_minor = $4,
         currency = $5, is_bundle = $6, problem_tags = $7
       WHERE id = $1 RETURNING ${PRODUCT_COLUMNS}`, [
            id,
            body.sku,
            body.title,
            body.amountMinor,
            body.currency,
            body.isBundle,
            body.problemTags,
        ]);
        if (rows.length === 0) {
            res.status(404).json({
                error: { code: "PRODUCT_NOT_FOUND", message: "No such product" },
            });
            return;
        }
        res.json({ data: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.adminShopRouter.delete("/admin/products/:id", async (req, res, next) => {
    try {
        const id = zod_1.z.coerce.number().int().positive().parse(req.params.id);
        const { rowCount } = await db_1.pool.query("DELETE FROM products WHERE id = $1", [id]);
        if (rowCount === 0) {
            res.status(404).json({
                error: { code: "PRODUCT_NOT_FOUND", message: "No such product" },
            });
            return;
        }
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
exports.adminShopRouter.post("/admin/products/:id/members", async (req, res, next) => {
    try {
        const id = zod_1.z.coerce.number().int().positive().parse(req.params.id);
        const body = zod_1.z
            .object({
            memberSku: zod_1.z.string().min(1),
            qty: zod_1.z.number().int().min(1).default(1),
        })
            .parse(req.body);
        await db_1.pool.query(`INSERT INTO bundle_items (bundle_product_id, member_sku, qty)
         VALUES ($1, $2, $3)
         ON CONFLICT (bundle_product_id, member_sku)
         DO UPDATE SET qty = $3`, [id, body.memberSku, body.qty]);
        res.status(201).json({ data: { ok: true } });
    }
    catch (err) {
        next(err);
    }
});
exports.adminShopRouter.get("/admin/orders", async (req, res, next) => {
    try {
        const status = req.query.status === undefined
            ? undefined
            : zod_1.z
                .enum(["pending_payment", "paid", "cancelled", "fulfilled"])
                .parse(req.query.status);
        const params = [];
        const clause = status === undefined ? "" : "WHERE o.status = $1";
        if (status !== undefined)
            params.push(status);
        const { rows } = await db_1.pool.query(`SELECT o.id, o.user_id AS "userId", u.email, o.status,
              o.amount_minor AS "amountMinor", o.currency,
              o.created_at AS "createdAt",
              p.status AS "paymentStatus", p.tx_ref AS "txRef",
              f.status AS "fulfillmentStatus", f.bridge_ref AS "bridgeRef"
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN payments p ON p.order_id = o.id
         LEFT JOIN fulfillment_orders f ON f.order_id = o.id
        ${clause} ORDER BY o.created_at DESC LIMIT 100`, params);
        res.json({ data: rows });
    }
    catch (err) {
        next(err);
    }
});
exports.adminShopRouter.get("/admin/orders/:id", async (req, res, next) => {
    try {
        const id = zod_1.z.coerce.number().int().positive().parse(req.params.id);
        const [order, items] = await Promise.all([
            db_1.pool.query(`SELECT o.id, o.user_id AS "userId", u.email, o.status,
                o.amount_minor AS "amountMinor", o.currency, o.shipping,
                o.created_at AS "createdAt",
                p.status AS "paymentStatus", p.tx_ref AS "txRef",
                f.status AS "fulfillmentStatus", f.bridge_ref AS "bridgeRef",
                f.last_error AS "fulfillmentError"
           FROM orders o
           JOIN users u ON u.id = o.user_id
           LEFT JOIN payments p ON p.order_id = o.id
           LEFT JOIN fulfillment_orders f ON f.order_id = o.id
          WHERE o.id = $1`, [id]),
            db_1.pool.query("SELECT sku, title, qty, unit_minor FROM order_items WHERE order_id = $1", [id]),
        ]);
        if (order.rows.length === 0) {
            res.status(404).json({
                error: { code: "ORDER_NOT_FOUND", message: "No such order" },
            });
            return;
        }
        res.json({ data: { ...order.rows[0], items: items.rows } });
    }
    catch (err) {
        next(err);
    }
});
/**
 * Refund via Flutterwave (live mode only). Stub mode refuses — refunding
 * without moving real money would corrupt the books.
 */
exports.adminShopRouter.post("/admin/orders/:id/refund", async (req, res, next) => {
    try {
        const id = zod_1.z.coerce.number().int().positive().parse(req.params.id);
        if (env_1.env.FLUTTERWAVE_LIVE !== "true" || !env_1.env.FLUTTERWAVE_SECRET_KEY) {
            res.status(409).json({
                error: {
                    code: "REFUND_UNAVAILABLE",
                    message: "Refunds require live Flutterwave keys",
                },
            });
            return;
        }
        const found = await db_1.pool.query(`SELECT p.tx_ref AS "txRef", p.status AS "paymentStatus"
         FROM payments p JOIN orders o ON o.id = p.order_id
        WHERE o.id = $1`, [id]);
        if (found.rows.length === 0 || found.rows[0].paymentStatus !== "paid") {
            res.status(409).json({
                error: { code: "NOT_REFUNDABLE", message: "Order has no paid payment" },
            });
            return;
        }
        const fw = await fetch("https://api.flutterwave.com/v3/refunds", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env_1.env.FLUTTERWAVE_SECRET_KEY}`,
            },
            body: JSON.stringify({ tx_ref: found.rows[0].txRef }),
        });
        if (!fw.ok) {
            res.status(502).json({
                error: { code: "REFUND_FAILED", message: `Flutterwave ${fw.status}` },
            });
            return;
        }
        await db_1.pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [
            id,
        ]);
        res.json({ data: { refunded: true } });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=adminShop.js.map