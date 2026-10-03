import { pool } from "./db";
import { logger } from "./logger";

/**
 * Fulfillment provider boundary (Phase 7).
 * Checkout and webhooks only talk to this interface — swapping the
 * interim WooCommerce bridge for a direct TeemDrop API later means
 * adding one provider, not touching commerce code.
 */
export type FulfillmentItem = {
  sku: string;
  title: string;
  qty: number;
};

export type FulfillmentJob = {
  orderId: number;
  items: FulfillmentItem[];
  shipping: Record<string, unknown>;
};

export type FulfillmentResult =
  | { status: "pushed"; bridgeRef: string }
  | { status: "awaiting-config" }
  | { status: "failed"; error: string };

export interface FulfillmentProvider {
  name: string;
  push(job: FulfillmentJob): Promise<FulfillmentResult>;
}

/**
 * Interim bridge: mirrors paid orders into an external WooCommerce store
 * that TeemDrop auto-syncs from. Requires WOO_URL/WOO_CK/WOO_CS;
 * without them jobs park in `awaiting-config` instead of failing.
 */
export class WooBridgeProvider implements FulfillmentProvider {
  name = "woo-bridge";

  async push(job: FulfillmentJob): Promise<FulfillmentResult> {
    const base = process.env.WOO_URL ?? "";
    const key = process.env.WOO_CK ?? "";
    const secret = process.env.WOO_CS ?? "";
    if (!base || !key || !secret) {
      return { status: "awaiting-config" };
    }
    try {
      const shipping = job.shipping as Record<string, string>;
      const res = await fetch(
        `${base.replace(/\/$/, "")}/wp-json/wc/v3/orders`,
        {
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
        },
      );
      if (!res.ok) {
        return { status: "failed", error: `woo ${res.status}` };
      }
      const order = (await res.json()) as { id?: number };
      return { status: "pushed", bridgeRef: String(order.id ?? "unknown") };
    } catch (err) {
      return {
        status: "failed",
        error: err instanceof Error ? err.message : "woo push failed",
      };
    }
  }
}

export async function processFulfillment(orderId: number): Promise<void> {
  const orderRes = await pool.query(
    `SELECT o.id, o.shipping,
            COALESCE(json_agg(json_build_object('sku', i.sku, 'title', i.title, 'qty', i.qty))
              FILTER (WHERE i.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items i ON i.order_id = o.id
      WHERE o.id = $1
      GROUP BY o.id`,
    [orderId],
  );
  if (orderRes.rows.length === 0) return;
  const provider = new WooBridgeProvider();
  const result = await provider.push({
    orderId,
    items: orderRes.rows[0].items as FulfillmentItem[],
    shipping: orderRes.rows[0].shipping as Record<string, unknown>,
  });
  if (result.status === "pushed") {
    await pool.query(
      `UPDATE fulfillment_orders
          SET status = 'pushed', bridge_ref = $2, attempts = attempts + 1, updated_at = now()
        WHERE order_id = $1`,
      [orderId, result.bridgeRef],
    );
  } else if (result.status === "awaiting-config") {
    await pool.query(
      `UPDATE fulfillment_orders
          SET status = 'awaiting-config', attempts = attempts + 1, updated_at = now()
        WHERE order_id = $1`,
      [orderId],
    );
    logger.info({ orderId }, "fulfillment parked: woo bridge not configured");
  } else {
    await pool.query(
      `UPDATE fulfillment_orders
          SET status = 'failed', last_error = $2, attempts = attempts + 1, updated_at = now()
        WHERE order_id = $1`,
      [orderId, result.error],
    );
  }
}
