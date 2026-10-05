"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopRouter = void 0;
exports.initFlutterwavePayment = initFlutterwavePayment;
const node_crypto_1 = require("node:crypto");
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const env_1 = require("../env");
const logger_1 = require("../logger");
const fulfillment_1 = require("../fulfillment");
exports.shopRouter = (0, express_1.Router)();
/** Problem-first recommendations: bundles first, ranked by tag overlap. */
exports.shopRouter.get("/shop/recommendations", async (req, res, next) => {
    try {
        const userId = req.query.userId === undefined
            ? undefined
            : zod_1.z.coerce.number().int().positive().parse(req.query.userId);
        const problem = req.query.problem === undefined
            ? undefined
            : zod_1.z.string().min(1).parse(req.query.problem);
        let pains = problem !== undefined ? [problem] : [];
        if (userId !== undefined) {
            const profile = await db_1.pool.query('SELECT pain_areas AS "painAreas" FROM profiles WHERE user_id = $1', [userId]);
            if (profile.rows[0]?.painAreas?.length) {
                pains = profile.rows[0].painAreas;
            }
        }
        const { rows } = await db_1.pool.query(`SELECT p.id, p.sku, p.title, p.amount_minor AS "amountMinor",
              p.currency, p.is_bundle AS "isBundle",
              p.problem_tags AS "problemTags",
              COALESCE(json_agg(json_build_object('sku', b.member_sku, 'qty', b.qty))
                FILTER (WHERE b.member_sku IS NOT NULL), '[]') AS members
         FROM products p
         LEFT JOIN bundle_items b ON b.bundle_product_id = p.id
        GROUP BY p.id ORDER BY p.is_bundle DESC, p.title ASC`);
        const ranked = rows
            .map((r) => {
            const tags = r.problemTags;
            const matched = tags.filter((t) => pains.includes(t));
            return {
                sku: r.sku,
                title: r.title,
                amountMinor: r.amountMinor,
                currency: r.currency,
                isBundle: r.isBundle,
                members: r.members,
                matchedTags: matched,
                score: matched.length,
            };
        })
            .sort((a, b) => Number(b.isBundle) - Number(a.isBundle) || b.score - a.score);
        res.json({ data: ranked });
    }
    catch (err) {
        next(err);
    }
});
/**
 * Product page data (Phase 13): story + how-to guides (articles/videos
 * sharing problem tags) + matching routines + related products.
 * Reviews/FAQs arrive with real data — see docs/user-flows.md.
 */
exports.shopRouter.get("/products/:sku", async (req, res, next) => {
    try {
        const sku = zod_1.z.string().min(1).max(60).parse(req.params.sku);
        const { rows } = await db_1.pool.query(`SELECT id, sku, title, amount_minor AS "amountMinor", currency,
              is_bundle AS "isBundle", problem_tags AS "problemTags",
              created_at AS "createdAt"
         FROM products WHERE sku = $1`, [sku]);
        if (rows.length === 0) {
            res.status(404).json({
                error: { code: "PRODUCT_NOT_FOUND", message: "No such product" },
            });
            return;
        }
        const product = rows[0];
        const [guides, routines, related, members] = await Promise.all([
            db_1.pool.query(`SELECT 'article' AS kind, id, slug, title FROM articles
          WHERE tags && $1 LIMIT 3`, [product.problemTags]),
            db_1.pool.query(`SELECT id, slug, title, duration_min FROM programs
          WHERE problem_tags && $1 ORDER BY duration_min ASC LIMIT 3`, [product.problemTags]),
            db_1.pool.query(`SELECT sku, title, amount_minor AS "amountMinor", currency
           FROM products
          WHERE sku <> $1 AND problem_tags && $2 LIMIT 4`, [sku, product.problemTags]),
            product.isBundle
                ? db_1.pool.query(`SELECT b.member_sku AS sku, p.title, b.qty
               FROM bundle_items b LEFT JOIN products p ON p.sku = b.member_sku
              WHERE b.bundle_product_id = $1`, [product.id])
                : Promise.resolve({ rows: [] }),
        ]);
        const videos = await db_1.pool.query(`SELECT 'video' AS kind, id, slug, title FROM videos
        WHERE tags && $1 LIMIT 3`, [product.problemTags]);
        res.json({
            data: {
                ...rows[0],
                guides: [...guides.rows, ...videos.rows],
                routines: routines.rows,
                related: related.rows,
                members: members.rows,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
const checkoutSchema = zod_1.z.object({
    userId: zod_1.z.number().int().positive(),
    items: zod_1.z
        .array(zod_1.z.object({
        sku: zod_1.z.string().min(1),
        qty: zod_1.z.number().int().min(1).max(99),
    }))
        .min(1),
    shipping: zod_1.z
        .object({
        name: zod_1.z.string().default(""),
        phone: zod_1.z.string().default(""),
        address: zod_1.z.string().default(""),
        city: zod_1.z.string().default(""),
        country: zod_1.z.string().default("NG"),
        email: zod_1.z.string().default(""),
    })
        .default({}),
});
/** Start a Flutterwave payment; stub link unless live mode is explicit. */
async function initFlutterwavePayment(args) {
    if (env_1.env.FLUTTERWAVE_LIVE !== "true" || !env_1.env.FLUTTERWAVE_SECRET_KEY) {
        return { paymentUrl: null, mode: "stub" };
    }
    const res = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env_1.env.FLUTTERWAVE_SECRET_KEY}`,
        },
        body: JSON.stringify({
            tx_ref: args.txRef,
            amount: args.amountMajor,
            currency: args.currency,
            ...(env_1.env.FLUTTERWAVE_REDIRECT_URL
                ? { redirect_url: env_1.env.FLUTTERWAVE_REDIRECT_URL }
                : {}),
            customer: {
                email: args.customerEmail,
                name: args.customerName,
                phonenumber: args.customerPhone,
            },
        }),
    });
    if (!res.ok)
        throw new Error(`flutterwave init ${res.status}`);
    const body = (await res.json());
    return { paymentUrl: body.data?.link ?? null, mode: "live" };
}
/**
 * Mark a tx_ref paid from any trusted signal (webhook or verified
 * return). Shared so both paths stay consistent. Returns what changed.
 */
async function confirmTxPaid(txRef, raw) {
    const found = await db_1.pool.query('SELECT id, order_id AS "orderId", status FROM payments WHERE tx_ref = $1', [txRef]);
    if (found.rows.length === 0) {
        const sub = await db_1.pool.query("SELECT id FROM subscriptions WHERE tx_ref = $1", [txRef]);
        if (sub.rows.length === 0)
            return null;
        const id = sub.rows[0].id;
        await db_1.pool.query(`UPDATE subscriptions SET status = 'active', started_at = COALESCE(started_at, now())
        WHERE id = $1`, [id]);
        return { kind: "subscription", id };
    }
    const payment = found.rows[0];
    if (payment.status === "paid")
        return { kind: "payment", orderId: payment.orderId, changed: false };
    await db_1.pool.query("UPDATE payments SET status = 'paid', raw = $2 WHERE id = $1", [payment.id, JSON.stringify(raw).slice(0, 4000)]);
    await db_1.pool.query("UPDATE orders SET status = 'paid' WHERE id = $1 AND status = 'pending_payment'", [payment.orderId]);
    await db_1.pool.query(`INSERT INTO fulfillment_orders (order_id, provider, status)
     VALUES ($1, 'woo-bridge', 'queued')
     ON CONFLICT (order_id) DO NOTHING`, [payment.orderId]);
    try {
        await (0, fulfillment_1.processFulfillment)(payment.orderId);
    }
    catch (err) {
        logger_1.logger.warn({ err, orderId: payment.orderId }, "fulfillment dispatch failed");
    }
    return { kind: "payment", orderId: payment.orderId, changed: true };
}
exports.shopRouter.post("/shop/checkout", async (req, res, next) => {
    try {
        const body = checkoutSchema.parse(req.body);
        const skus = [...new Set(body.items.map((i) => i.sku))];
        const { rows } = await db_1.pool.query('SELECT sku, title, amount_minor AS "amountMinor", currency FROM products WHERE sku = ANY($1)', [skus]);
        if (rows.length !== skus.length) {
            res.status(404).json({
                error: { code: "SKU_NOT_FOUND", message: "Unknown product sku" },
            });
            return;
        }
        const bySku = new Map(rows.map((r) => [
            r.sku,
            {
                title: r.title,
                unitMinor: r.amountMinor,
                currency: r.currency,
            },
        ]));
        const total = body.items.reduce((sum, i) => sum + bySku.get(i.sku).unitMinor * i.qty, 0);
        const currency = bySku.get(body.items[0].sku).currency;
        const txRef = `VYN-${Date.now()}-${(0, node_crypto_1.randomBytes)(4).toString("hex")}`;
        const order = (await db_1.pool.query(`INSERT INTO orders (user_id, status, amount_minor, currency, shipping)
         VALUES ($1, 'pending_payment', $2, $3, $4)
         RETURNING id, user_id AS "userId", status,
                   amount_minor AS "amountMinor", currency, shipping,
                   created_at AS "createdAt"`, [body.userId, total, currency, JSON.stringify(body.shipping)])).rows[0];
        for (const item of body.items) {
            const p = bySku.get(item.sku);
            await db_1.pool.query(`INSERT INTO order_items (order_id, sku, title, qty, unit_minor)
         VALUES ($1, $2, $3, $4, $5)`, [order.id, item.sku, p.title, item.qty, p.unitMinor]);
        }
        const init = await initFlutterwavePayment({
            txRef,
            amountMajor: total / 100,
            currency,
            customerName: body.shipping.name,
            customerEmail: body.shipping.email,
            customerPhone: body.shipping.phone,
        });
        const payment = (await db_1.pool.query(`INSERT INTO payments (order_id, provider, tx_ref, status, raw)
         VALUES ($1, 'flutterwave', $2, 'pending', $3)
         RETURNING id, order_id AS "orderId", provider,
                   tx_ref AS "txRef", status`, [order.id, txRef, JSON.stringify({ mode: init.mode })])).rows[0];
        res.status(201).json({
            data: { order, payment: { ...payment, paymentUrl: init.paymentUrl } },
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * Flutterwave webhook: verify `verif-hash`, mark paid, queue fulfillment.
 * Accepts the documented v3 shape ({event, data:{tx_ref,status}}) and a
 * flat test shape ({txRef, status:"successful"}).
 */
exports.shopRouter.post("/shop/payments/webhook", async (req, res, next) => {
    try {
        if (!env_1.env.FLUTTERWAVE_SECRET_KEY) {
            res.status(503).json({
                error: {
                    code: "PAYMENTS_UNCONFIGURED",
                    message: "Webhook secret not set",
                },
            });
            return;
        }
        if (req.header("verif-hash") !== env_1.env.FLUTTERWAVE_SECRET_KEY) {
            res.status(401).json({
                error: { code: "BAD_SIGNATURE", message: "Invalid webhook signature" },
            });
            return;
        }
        const body = req.body;
        const txRef = body.txRef ?? body.data?.tx_ref;
        const status = body.status ?? body.data?.status;
        if (!txRef || status !== "successful") {
            res.json({ received: true, acted: false });
            return;
        }
        const result = await confirmTxPaid(txRef, body);
        if (result === null) {
            res.status(404).json({
                error: { code: "PAYMENT_NOT_FOUND", message: "Unknown tx_ref" },
            });
            return;
        }
        res.json({
            received: true,
            acted: true,
            ...(result.kind === "subscription" ? { subscription: true } : {}),
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * Browser return page after hosted checkout. Verifies the charge with
 * Flutterwave (live mode, via transaction_id) before confirming, then
 * shows a plain success page telling the user to return to the app.
 */
exports.shopRouter.get("/shop/payments/return", async (req, res, next) => {
    try {
        const txRef = typeof req.query.tx_ref === "string" ? req.query.tx_ref : undefined;
        const transactionId = typeof req.query.transaction_id === "string"
            ? req.query.transaction_id
            : undefined;
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        const fail = (message) => res
            .status(400)
            .send(`<html><body style="font-family:sans-serif;padding:32px"><h2>Payment not confirmed</h2><p>${message}</p><p>Return to the app and use “Check status”.</p></body></html>`);
        if (!txRef || status !== "successful") {
            return fail("Missing or failed payment reference.");
        }
        if (env_1.env.FLUTTERWAVE_LIVE === "true" && env_1.env.FLUTTERWAVE_SECRET_KEY) {
            if (!transactionId)
                return fail("Missing Flutterwave transaction id.");
            const verify = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
                headers: { Authorization: `Bearer ${env_1.env.FLUTTERWAVE_SECRET_KEY}` },
            });
            if (!verify.ok)
                return fail("Could not verify with Flutterwave.");
            const v = (await verify.json());
            if (v.data?.status !== "successful" || v.data?.tx_ref !== txRef) {
                return fail("Flutterwave did not confirm this payment.");
            }
        }
        const result = await confirmTxPaid(txRef, {
            via: "return-url",
            transactionId: transactionId ?? null,
        });
        if (result === null)
            return fail("Unknown payment reference.");
        res.send(`<html><body style="font-family:sans-serif;padding:32px"><h2>✓ Payment received</h2><p>Return to the Vyn app — your order is confirmed.</p></body></html>`);
    }
    catch (err) {
        next(err);
    }
});
/** Local payment status for app polling (tx_ref is unguessable). */
exports.shopRouter.get("/shop/payments/status", async (req, res, next) => {
    try {
        const txRef = zod_1.z.string().min(1).parse(req.query.txRef);
        const [payment, sub] = await Promise.all([
            db_1.pool.query("SELECT status FROM payments WHERE tx_ref = $1", [txRef]),
            db_1.pool.query("SELECT status FROM subscriptions WHERE tx_ref = $1", [txRef]),
        ]);
        if (payment.rows.length > 0) {
            res.json({
                data: { kind: "payment", status: payment.rows[0].status },
            });
            return;
        }
        if (sub.rows.length > 0) {
            res.json({
                data: { kind: "subscription", status: sub.rows[0].status },
            });
            return;
        }
        res.status(404).json({
            error: { code: "PAYMENT_NOT_FOUND", message: "Unknown tx_ref" },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.shopRouter.get("/shop/orders", async (req, res, next) => {
    try {
        const userId = zod_1.z.coerce.number().int().positive().parse(req.query.userId);
        const { rows } = await db_1.pool.query(`SELECT o.id, o.user_id AS "userId", o.status,
              o.amount_minor AS "amountMinor", o.currency,
              o.created_at AS "createdAt",
              COALESCE(json_agg(json_build_object('sku', i.sku, 'title', i.title, 'qty', i.qty, 'unitMinor', i.unit_minor))
                FILTER (WHERE i.id IS NOT NULL), '[]') AS items,
              p.status AS "paymentStatus", p.tx_ref AS "txRef",
              f.status AS "fulfillmentStatus", f.bridge_ref AS "bridgeRef"
         FROM orders o
         LEFT JOIN order_items i ON i.order_id = o.id
         LEFT JOIN payments p ON p.order_id = o.id
         LEFT JOIN fulfillment_orders f ON f.order_id = o.id
        WHERE o.user_id = $1
        GROUP BY o.id, p.status, p.tx_ref, f.status, f.bridge_ref
        ORDER BY o.created_at DESC`, [userId]);
        res.json({ data: rows });
    }
    catch (err) {
        next(err);
    }
});
const qrCreateSchema = zod_1.z.object({
    kind: zod_1.z.enum(["product", "program"]),
    ref: zod_1.z.string().min(1).max(120),
});
exports.shopRouter.post("/admin/qr", async (req, res, next) => {
    try {
        const body = qrCreateSchema.parse(req.body);
        const code = "VYN1-" +
            (0, node_crypto_1.createHmac)("sha256", env_1.env.QR_SECRET)
                .update(`${body.kind}:${body.ref}`)
                .digest("base64url")
                .slice(0, 12)
                .toUpperCase();
        const { rows } = await db_1.pool.query(`INSERT INTO qr_codes (kind, ref, code)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET kind = $1, ref = $2
       RETURNING kind, ref, code`, [body.kind, body.ref, code]);
        res.status(201).json({ data: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.shopRouter.get("/qr/resolve", async (req, res, next) => {
    try {
        const code = zod_1.z.string().min(1).parse(req.query.code);
        const { rows } = await db_1.pool.query("SELECT kind, ref FROM qr_codes WHERE code = $1", [code]);
        if (rows.length === 0) {
            res
                .status(404)
                .json({ error: { code: "QR_NOT_FOUND", message: "Unknown code" } });
            return;
        }
        const { kind, ref } = rows[0];
        await db_1.pool.query("UPDATE qr_codes SET scans = scans + 1 WHERE code = $1", [
            code,
        ]);
        const expected = "VYN1-" +
            (0, node_crypto_1.createHmac)("sha256", env_1.env.QR_SECRET)
                .update(`${kind}:${ref}`)
                .digest("base64url")
                .slice(0, 12)
                .toUpperCase();
        if (expected !== code) {
            res.status(401).json({
                error: { code: "QR_INVALID", message: "Signature mismatch" },
            });
            return;
        }
        res.json({
            data: {
                kind,
                ref,
                path: kind === "program" ? `/programs/${ref}` : `/products/${ref}`,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=shop.js.map