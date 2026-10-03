import { createHmac, randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { env } from "../env";
import { logger } from "../logger";
import { processFulfillment } from "../fulfillment";

export const shopRouter = Router();

/** Problem-first recommendations: bundles first, ranked by tag overlap. */
shopRouter.get("/shop/recommendations", async (req, res, next) => {
  try {
    const userId =
      req.query.userId === undefined
        ? undefined
        : z.coerce.number().int().positive().parse(req.query.userId);
    const problem =
      req.query.problem === undefined
        ? undefined
        : z.string().min(1).parse(req.query.problem);
    let pains: string[] = problem !== undefined ? [problem] : [];
    if (userId !== undefined) {
      const profile = await pool.query(
        'SELECT pain_areas AS "painAreas" FROM profiles WHERE user_id = $1',
        [userId],
      );
      if ((profile.rows[0]?.painAreas as string[] | undefined)?.length) {
        pains = profile.rows[0].painAreas as string[];
      }
    }
    const { rows } = await pool.query(
      `SELECT p.id, p.sku, p.title, p.amount_minor AS "amountMinor",
              p.currency, p.is_bundle AS "isBundle",
              p.problem_tags AS "problemTags",
              COALESCE(json_agg(json_build_object('sku', b.member_sku, 'qty', b.qty))
                FILTER (WHERE b.member_sku IS NOT NULL), '[]') AS members
         FROM products p
         LEFT JOIN bundle_items b ON b.bundle_product_id = p.id
        GROUP BY p.id ORDER BY p.is_bundle DESC, p.title ASC`,
    );
    const ranked = rows
      .map((r) => {
        const tags = r.problemTags as string[];
        const matched = tags.filter((t) => pains.includes(t));
        return {
          sku: r.sku as string,
          title: r.title as string,
          amountMinor: r.amountMinor as number,
          currency: r.currency as string,
          isBundle: r.isBundle as boolean,
          members: r.members as { sku: string; qty: number }[],
          matchedTags: matched,
          score: matched.length,
        };
      })
      .sort(
        (a, b) => Number(b.isBundle) - Number(a.isBundle) || b.score - a.score,
      );
    res.json({ data: ranked });
  } catch (err) {
    next(err);
  }
});

const checkoutSchema = z.object({
  userId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1),
  shipping: z
    .object({
      name: z.string().default(""),
      phone: z.string().default(""),
      address: z.string().default(""),
      city: z.string().default(""),
      country: z.string().default("NG"),
      email: z.string().default(""),
    })
    .default({}),
});

/** Start a Flutterwave payment; stub link unless live mode is explicit. */
async function initFlutterwavePayment(args: {
  txRef: string;
  amountMajor: number;
  currency: string;
  customerName: string;
  customerEmail: string;
}): Promise<{ paymentUrl: string | null; mode: "live" | "stub" }> {
  if (env.FLUTTERWAVE_LIVE !== "true" || !env.FLUTTERWAVE_SECRET_KEY) {
    return { paymentUrl: null, mode: "stub" };
  }
  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
    },
    body: JSON.stringify({
      tx_ref: args.txRef,
      amount: args.amountMajor,
      currency: args.currency,
      customer: { email: args.customerEmail, name: args.customerName },
    }),
  });
  if (!res.ok) throw new Error(`flutterwave init ${res.status}`);
  const body = (await res.json()) as { data?: { link?: string } };
  return { paymentUrl: body.data?.link ?? null, mode: "live" };
}

shopRouter.post("/shop/checkout", async (req, res, next) => {
  try {
    const body = checkoutSchema.parse(req.body);
    const skus = [...new Set(body.items.map((i) => i.sku))];
    const { rows } = await pool.query(
      'SELECT sku, title, amount_minor AS "amountMinor", currency FROM products WHERE sku = ANY($1)',
      [skus],
    );
    if (rows.length !== skus.length) {
      res.status(404).json({
        error: { code: "SKU_NOT_FOUND", message: "Unknown product sku" },
      });
      return;
    }
    const bySku = new Map(
      rows.map((r) => [
        r.sku as string,
        {
          title: r.title as string,
          unitMinor: r.amountMinor as number,
          currency: r.currency as string,
        },
      ]),
    );
    const total = body.items.reduce(
      (sum, i) => sum + bySku.get(i.sku)!.unitMinor * i.qty,
      0,
    );
    const currency = bySku.get(body.items[0].sku)!.currency;
    const txRef = `VYN-${Date.now()}-${randomBytes(4).toString("hex")}`;

    const order = (
      await pool.query(
        `INSERT INTO orders (user_id, status, amount_minor, currency, shipping)
         VALUES ($1, 'pending_payment', $2, $3, $4)
         RETURNING id, user_id AS "userId", status,
                   amount_minor AS "amountMinor", currency, shipping,
                   created_at AS "createdAt"`,
        [body.userId, total, currency, JSON.stringify(body.shipping)],
      )
    ).rows[0];

    for (const item of body.items) {
      const p = bySku.get(item.sku)!;
      await pool.query(
        `INSERT INTO order_items (order_id, sku, title, qty, unit_minor)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.sku, p.title, item.qty, p.unitMinor],
      );
    }

    const init = await initFlutterwavePayment({
      txRef,
      amountMajor: total / 100,
      currency,
      customerName: body.shipping.name,
      customerEmail: body.shipping.email,
    });

    const payment = (
      await pool.query(
        `INSERT INTO payments (order_id, provider, tx_ref, status, raw)
         VALUES ($1, 'flutterwave', $2, 'pending', $3)
         RETURNING id, order_id AS "orderId", provider,
                   tx_ref AS "txRef", status`,
        [order.id, txRef, JSON.stringify({ mode: init.mode })],
      )
    ).rows[0];

    res.status(201).json({
      data: { order, payment: { ...payment, paymentUrl: init.paymentUrl } },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Flutterwave webhook: verify `verif-hash`, mark paid, queue fulfillment.
 * Accepts the documented v3 shape ({event, data:{tx_ref,status}}) and a
 * flat test shape ({txRef, status:"successful"}).
 */
shopRouter.post("/shop/payments/webhook", async (req, res, next) => {
  try {
    if (!env.FLUTTERWAVE_SECRET_KEY) {
      res.status(503).json({
        error: {
          code: "PAYMENTS_UNCONFIGURED",
          message: "Webhook secret not set",
        },
      });
      return;
    }
    if (req.header("verif-hash") !== env.FLUTTERWAVE_SECRET_KEY) {
      res.status(401).json({
        error: { code: "BAD_SIGNATURE", message: "Invalid webhook signature" },
      });
      return;
    }
    const body = req.body as {
      txRef?: string;
      status?: string;
      event?: string;
      data?: { tx_ref?: string; status?: string };
    };
    const txRef = body.txRef ?? body.data?.tx_ref;
    const status = body.status ?? body.data?.status;
    if (!txRef || status !== "successful") {
      res.json({ received: true, acted: false });
      return;
    }
    const found = await pool.query(
      'SELECT id, order_id AS "orderId", status FROM payments WHERE tx_ref = $1',
      [txRef],
    );
    if (found.rows.length === 0) {
      // Maybe a subscription charge: activate on tx_ref match.
      const sub = await pool.query(
        "SELECT id, status FROM subscriptions WHERE tx_ref = $1",
        [txRef],
      );
      if (sub.rows.length === 0) {
        res.status(404).json({
          error: { code: "PAYMENT_NOT_FOUND", message: "Unknown tx_ref" },
        });
        return;
      }
      await pool.query(
        `UPDATE subscriptions SET status = 'active', started_at = COALESCE(started_at, now())
          WHERE id = $1`,
        [(sub.rows[0] as { id: number }).id],
      );
      res.json({ received: true, acted: true, subscription: true });
      return;
    }
    const payment = found.rows[0] as {
      id: number;
      orderId: number;
      status: string;
    };
    if (payment.status !== "paid") {
      await pool.query(
        "UPDATE payments SET status = 'paid', raw = $2 WHERE id = $1",
        [payment.id, JSON.stringify(body).slice(0, 4000)],
      );
      await pool.query(
        "UPDATE orders SET status = 'paid' WHERE id = $1 AND status = 'pending_payment'",
        [payment.orderId],
      );
      await pool.query(
        `INSERT INTO fulfillment_orders (order_id, provider, status)
         VALUES ($1, 'woo-bridge', 'queued')
         ON CONFLICT (order_id) DO NOTHING`,
        [payment.orderId],
      );
    }
    try {
      await processFulfillment(payment.orderId);
    } catch (err) {
      logger.warn(
        { err, orderId: payment.orderId },
        "fulfillment dispatch failed",
      );
    }
    res.json({ received: true, acted: true });
  } catch (err) {
    next(err);
  }
});

shopRouter.get("/shop/orders", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.query.userId);
    const { rows } = await pool.query(
      `SELECT o.id, o.user_id AS "userId", o.status,
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
        ORDER BY o.created_at DESC`,
      [userId],
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

const qrCreateSchema = z.object({
  kind: z.enum(["product", "program"]),
  ref: z.string().min(1).max(120),
});

shopRouter.post("/admin/qr", async (req, res, next) => {
  try {
    const body = qrCreateSchema.parse(req.body);
    const code =
      "VYN1-" +
      createHmac("sha256", env.QR_SECRET)
        .update(`${body.kind}:${body.ref}`)
        .digest("base64url")
        .slice(0, 12)
        .toUpperCase();
    const { rows } = await pool.query(
      `INSERT INTO qr_codes (kind, ref, code)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET kind = $1, ref = $2
       RETURNING kind, ref, code`,
      [body.kind, body.ref, code],
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

shopRouter.get("/qr/resolve", async (req, res, next) => {
  try {
    const code = z.string().min(1).parse(req.query.code);
    const { rows } = await pool.query(
      "SELECT kind, ref FROM qr_codes WHERE code = $1",
      [code],
    );
    if (rows.length === 0) {
      res
        .status(404)
        .json({ error: { code: "QR_NOT_FOUND", message: "Unknown code" } });
      return;
    }
    const { kind, ref } = rows[0] as { kind: string; ref: string };
    await pool.query("UPDATE qr_codes SET scans = scans + 1 WHERE code = $1", [
      code,
    ]);
    const expected =
      "VYN1-" +
      createHmac("sha256", env.QR_SECRET)
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
  } catch (err) {
    next(err);
  }
});
