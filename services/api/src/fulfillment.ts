import { pool } from "./db";
import { env } from "./env";
import { logger } from "./logger";
import {
  buildWooOrderPayload,
  parseWooTracking,
  resolveLineItems,
  type LineItem,
  type ShippingInfo,
} from "./woo";

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

/** Max attempts before a job is left for an operator to retry by hand. */
const MAX_ATTEMPTS = 8;

type WooConfig = { base: string; key: string; secret: string } | null;

function wooConfig(): WooConfig {
  const base = env.WOO_URL.replace(/\/$/, "");
  if (!base || !env.WOO_CK || !env.WOO_CS) return null;
  return { base, key: env.WOO_CK, secret: env.WOO_CS };
}

function authHeader(cfg: NonNullable<WooConfig>): string {
  return `Basic ${Buffer.from(`${cfg.key}:${cfg.secret}`).toString("base64")}`;
}

async function errorDetail(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return `woo ${res.status}: ${text.slice(0, 300)}`;
  } catch {
    return `woo ${res.status}`;
  }
}

/**
 * Interim bridge: mirrors paid orders into an external WooCommerce store
 * that TeemDrop auto-syncs from. Requires WOO_URL/WOO_CK/WOO_CS;
 * without them jobs park in `awaiting-config` instead of failing.
 */
export class WooBridgeProvider implements FulfillmentProvider {
  name = "woo-bridge";

  async push(job: FulfillmentJob): Promise<FulfillmentResult> {
    const cfg = wooConfig();
    if (cfg === null) return { status: "awaiting-config" };

    const memberships = await loadBundleMemberships(job.items);
    const lineItems = resolveLineItems(
      job.items.map((i) => ({ sku: i.sku, qty: i.qty })),
      memberships,
      env.WOO_BUNDLE_MODE,
    );
    if (lineItems.length === 0) {
      return { status: "failed", error: "order has no fulfillable items" };
    }

    try {
      const existing = await this.findExistingOrder(cfg, job.orderId);
      if (existing !== null) {
        return { status: "pushed", bridgeRef: existing };
      }
      const res = await this.wooFetch(cfg, "/wp-json/wc/v3/orders", {
        method: "POST",
        body: JSON.stringify(
          buildWooOrderPayload(
            job.orderId,
            job.shipping as ShippingInfo,
            lineItems,
          ),
        ),
      });
      if (!res.ok) {
        return { status: "failed", error: await errorDetail(res) };
      }
      const order = (await res.json()) as { id?: number };
      if (typeof order.id !== "number") {
        return { status: "failed", error: "woo response missing order id" };
      }
      return { status: "pushed", bridgeRef: String(order.id) };
    } catch (err) {
      return {
        status: "failed",
        error: err instanceof Error ? err.message : "woo push failed",
      };
    }
  }

  private async wooFetch(
    cfg: NonNullable<WooConfig>,
    path: string,
    init: { method: string; body?: string },
  ): Promise<Response> {
    return fetch(`${cfg.base}${path}`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(cfg),
      },
      body: init.body,
      signal: AbortSignal.timeout(env.WOO_TIMEOUT_MS),
    });
  }

  /** Best-effort duplicate guard: reuse the Woo order we already created. */
  private async findExistingOrder(
    cfg: NonNullable<WooConfig>,
    orderId: number,
  ): Promise<string | null> {
    try {
      const res = await this.wooFetch(
        cfg,
        `/wp-json/wc/v3/orders?meta_key=vyn_order_id&meta_value=${orderId}`,
        { method: "GET" },
      );
      if (!res.ok) return null;
      const rows = (await res.json()) as { id?: number }[];
      return Array.isArray(rows) && typeof rows[0]?.id === "number"
        ? String(rows[0].id)
        : null;
    } catch {
      return null;
    }
  }
}

/** Resolve bundle members for the ordered SKUs (empty for non-bundles). */
async function loadBundleMemberships(
  items: FulfillmentItem[],
): Promise<Map<string, LineItem[]>> {
  const skus = [...new Set(items.map((i) => i.sku))];
  if (skus.length === 0) return new Map();
  const { rows } = await pool.query(
    `SELECT p.sku AS "bundleSku", b.member_sku AS "memberSku", b.qty
       FROM bundle_items b JOIN products p ON p.id = b.bundle_product_id
      WHERE p.sku = ANY($1)`,
    [skus],
  );
  const byBundle = new Map<string, LineItem[]>();
  for (const r of rows as { bundleSku: string; memberSku: string; qty: number }[]) {
    const members = byBundle.get(r.bundleSku) ?? [];
    members.push({ sku: r.memberSku, qty: r.qty });
    byBundle.set(r.bundleSku, members);
  }
  return byBundle;
}

export function getProvider(): FulfillmentProvider {
  // Exit path: register a `teemdrop` provider here once TD confirms an API.
  switch (env.FULFILLMENT_PROVIDER) {
    case "woo-bridge":
    default:
      return new WooBridgeProvider();
  }
}

/**
 * Push a paid order to the bridge exactly once. Idempotent: a job already
 * `pushed` is skipped so webhook replays and retries never duplicate.
 */
export async function processFulfillment(orderId: number): Promise<void> {
  const orderRes = await pool.query(
    `SELECT o.id, o.status, o.shipping, f.status AS "fulfillmentStatus"
       FROM orders o
       LEFT JOIN fulfillment_orders f ON f.order_id = o.id
      WHERE o.id = $1`,
    [orderId],
  );
  if (orderRes.rows.length === 0) return;
  const row = orderRes.rows[0] as { fulfillmentStatus: string | null };
  if (row.fulfillmentStatus === "pushed") return;

  const itemsRes = await pool.query(
    `SELECT sku, title, qty FROM order_items WHERE order_id = $1`,
    [orderId],
  );
  const provider = getProvider();
  const result = await provider.push({
    orderId,
    items: itemsRes.rows as FulfillmentItem[],
    shipping: orderRes.rows[0].shipping as Record<string, unknown>,
  });

  if (result.status === "pushed") {
    await pool.query(
      `UPDATE fulfillment_orders
          SET status = 'pushed', bridge_ref = $2, last_error = NULL,
              attempts = attempts + 1, updated_at = now()
        WHERE order_id = $1`,
      [orderId, result.bridgeRef],
    );
    logger.info({ orderId, bridgeRef: result.bridgeRef }, "fulfillment pushed");
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
          SET status = 'failed', last_error = $2, attempts = attempts + 1,
              updated_at = now()
        WHERE order_id = $1`,
      [orderId, result.error],
    );
    logger.warn({ orderId, error: result.error }, "fulfillment failed");
  }
}

/** Admin-triggered re-dispatch: reset the outbox row then push again. */
export async function retryFulfillment(orderId: number): Promise<FulfillmentResult> {
  const found = await pool.query(
    "SELECT order_id FROM fulfillment_orders WHERE order_id = $1",
    [orderId],
  );
  if (found.rows.length === 0) {
    await pool.query(
      `INSERT INTO fulfillment_orders (order_id, provider, status)
       VALUES ($1, $2, 'queued') ON CONFLICT (order_id) DO NOTHING`,
      [orderId, env.FULFILLMENT_PROVIDER],
    );
  } else {
    await pool.query(
      `UPDATE fulfillment_orders
          SET status = 'queued', attempts = 0, updated_at = now()
        WHERE order_id = $1 AND status <> 'pushed'`,
      [orderId],
    );
  }
  await processFulfillment(orderId);
  const { rows } = await pool.query(
    `SELECT status, bridge_ref AS "bridgeRef", last_error AS "lastError"
       FROM fulfillment_orders WHERE order_id = $1`,
    [orderId],
  );
  const after = rows[0] as
    | { status: string; bridgeRef: string | null; lastError: string | null }
    | undefined;
  if (after?.status === "pushed") {
    return { status: "pushed", bridgeRef: after.bridgeRef ?? "unknown" };
  }
  if (after?.status === "awaiting-config") return { status: "awaiting-config" };
  return { status: "failed", error: after?.lastError ?? "unknown" };
}

/**
 * Pull tracking back from Woo for already-pushed orders (TeemDrop →
 * Woo order meta → here) and flip fulfilled orders. Runs in the worker.
 */
export async function pollFulfillmentTracking(): Promise<void> {
  const cfg = wooConfig();
  if (cfg === null) return;
  const { rows } = await pool.query(
    `SELECT order_id AS "orderId", bridge_ref AS "bridgeRef"
       FROM fulfillment_orders
      WHERE status = 'pushed' AND bridge_ref ~ '^[0-9]+$'
      ORDER BY updated_at ASC LIMIT 50`,
  );
  for (const r of rows as { orderId: number; bridgeRef: string }[]) {
    try {
      const res = await fetch(`${cfg.base}/wp-json/wc/v3/orders/${r.bridgeRef}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(cfg),
        },
        signal: AbortSignal.timeout(env.WOO_TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const t = parseWooTracking((await res.json()) as Record<string, unknown>);
      await pool.query(
        `UPDATE fulfillment_orders
            SET woo_status = $2, tracking_number = $3, tracking_url = $4,
                carrier = $5, last_polled_at = now(), updated_at = now()
          WHERE order_id = $1`,
        [
          r.orderId,
          t.wooStatus,
          t.trackingNumber,
          t.trackingUrl,
          t.carrier,
        ],
      );
      if (t.fulfilled) {
        await pool.query(
          "UPDATE orders SET status = 'fulfilled' WHERE id = $1 AND status = 'paid'",
          [r.orderId],
        );
      }
    } catch (err) {
      logger.warn({ err, orderId: r.orderId }, "tracking poll failed");
    }
  }
}

/**
 * Retry sweep: re-push transiently failed / unconfigured jobs with a
 * simple attempt cap. Skips jobs that already hit MAX_ATTEMPTS.
 */
export async function sweepFulfillmentRetries(): Promise<void> {
  const { rows } = await pool.query(
    `SELECT order_id AS "orderId"
       FROM fulfillment_orders
      WHERE status IN ('failed', 'queued', 'awaiting-config')
        AND attempts < $1
      ORDER BY updated_at ASC LIMIT 50`,
    [MAX_ATTEMPTS],
  );
  for (const r of rows as { orderId: number }[]) {
    try {
      await processFulfillment(r.orderId);
    } catch (err) {
      logger.warn({ err, orderId: r.orderId }, "retry sweep failed");
    }
  }
}
