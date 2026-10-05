"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WooBridgeProvider = void 0;
exports.processFulfillment = processFulfillment;
const db_1 = require("./db");
const logger_1 = require("./logger");
/**
 * Interim bridge: mirrors paid orders into an external WooCommerce store
 * that TeemDrop auto-syncs from. Requires WOO_URL/WOO_CK/WOO_CS;
 * without them jobs park in `awaiting-config` instead of failing.
 */
class WooBridgeProvider {
    name = "woo-bridge";
    async push(job) {
        const base = process.env.WOO_URL ?? "";
        const key = process.env.WOO_CK ?? "";
        const secret = process.env.WOO_CS ?? "";
        if (!base || !key || !secret) {
            return { status: "awaiting-config" };
        }
        try {
            const shipping = job.shipping;
            const res = await fetch(`${base.replace(/\/$/, "")}/wp-json/wc/v3/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
                },
                body: JSON.stringify({
                    payment_method: "flutterwave",
                    payment_method_title: "Flutterwave",
                    set_paid: true,
                    billing: {
                        first_name: shipping.name ?? "Vyn customer",
                        phone: shipping.phone ?? "",
                        address_1: shipping.address ?? "",
                        city: shipping.city ?? "",
                        country: shipping.country ?? "",
                        email: shipping.email ?? "",
                    },
                    shipping: {
                        first_name: shipping.name ?? "Vyn customer",
                        address_1: shipping.address ?? "",
                        city: shipping.city ?? "",
                        country: shipping.country ?? "",
                    },
                    line_items: job.items.map((i) => ({
                        sku: i.sku,
                        quantity: i.qty,
                    })),
                    meta_data: [{ key: "vyn_order_id", value: String(job.orderId) }],
                }),
            });
            if (!res.ok) {
                return { status: "failed", error: `woo ${res.status}` };
            }
            const order = (await res.json());
            return { status: "pushed", bridgeRef: String(order.id ?? "unknown") };
        }
        catch (err) {
            return {
                status: "failed",
                error: err instanceof Error ? err.message : "woo push failed",
            };
        }
    }
}
exports.WooBridgeProvider = WooBridgeProvider;
async function processFulfillment(orderId) {
    const orderRes = await db_1.pool.query(`SELECT o.id, o.shipping,
            COALESCE(json_agg(json_build_object('sku', i.sku, 'title', i.title, 'qty', i.qty))
              FILTER (WHERE i.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items i ON i.order_id = o.id
      WHERE o.id = $1
      GROUP BY o.id`, [orderId]);
    if (orderRes.rows.length === 0)
        return;
    const provider = new WooBridgeProvider();
    const result = await provider.push({
        orderId,
        items: orderRes.rows[0].items,
        shipping: orderRes.rows[0].shipping,
    });
    if (result.status === "pushed") {
        await db_1.pool.query(`UPDATE fulfillment_orders
          SET status = 'pushed', bridge_ref = $2, attempts = attempts + 1, updated_at = now()
        WHERE order_id = $1`, [orderId, result.bridgeRef]);
    }
    else if (result.status === "awaiting-config") {
        await db_1.pool.query(`UPDATE fulfillment_orders
          SET status = 'awaiting-config', attempts = attempts + 1, updated_at = now()
        WHERE order_id = $1`, [orderId]);
        logger_1.logger.info({ orderId }, "fulfillment parked: woo bridge not configured");
    }
    else {
        await db_1.pool.query(`UPDATE fulfillment_orders
          SET status = 'failed', last_error = $2, attempts = attempts + 1, updated_at = now()
        WHERE order_id = $1`, [orderId, result.error]);
    }
}
//# sourceMappingURL=fulfillment.js.map