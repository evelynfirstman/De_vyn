import "dotenv/config";
import { Pool } from "pg";

/**
 * Mirror the Vyn catalog into the external WooCommerce bridge store so
 * incoming orders can reference real product SKUs (Phase 7, plan §7.2).
 * Idempotent: matches on SKU and updates in place. Run:
 *   npm run woo:sync --workspace services/api -- --dry-run
 *   npm run woo:sync --workspace services/api
 *
 * NOTE: the Woo store currency must match the catalog currency (NGN).
 */

const base = (process.env.WOO_URL ?? "").replace(/\/$/, "");
const key = process.env.WOO_CK ?? "";
const secret = process.env.WOO_CS ?? "";
const dryRun = process.argv.includes("--dry-run");

if (!base || !key || !secret) {
  console.error("Set WOO_URL, WOO_CK and WOO_CS before syncing.");
  process.exit(1);
}

const auth = `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function woo(path, init = {}) {
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
      ...(init.headers ?? {}),
    },
  });
}

async function upsertProduct(product) {
  const body = {
    sku: product.sku,
    name: product.title,
    type: "simple",
    regular_price: (product.amountMinor / 100).toString(),
    catalog_visibility: "hidden",
    status: "publish",
  };
  if (dryRun) return "dry-run";

  const found = await woo(
    `/wp-json/wc/v3/products?sku=${encodeURIComponent(product.sku)}`,
  );
  const rows = found.ok ? await found.json() : [];
  if (
    Array.isArray(rows) &&
    rows.length > 0 &&
    typeof rows[0]?.id === "number"
  ) {
    const res = await woo(`/wp-json/wc/v3/products/${rows[0].id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return res.ok ? "updated" : `error ${res.status}`;
  }
  const res = await woo("/wp-json/wc/v3/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.ok ? "created" : `error ${res.status}`;
}

async function main() {
  const { rows } = await pool.query(
    `SELECT sku, title, amount_minor AS "amountMinor"
       FROM products ORDER BY id ASC`,
  );
  console.log(
    `${dryRun ? "[dry-run] " : ""}Syncing ${rows.length} products to ${base}`,
  );
  let created = 0;
  let updated = 0;
  let failed = 0;
  for (const product of rows) {
    try {
      const result = await upsertProduct(product);
      if (result === "created" || result === "dry-run") created++;
      else if (result === "updated") updated++;
      else {
        failed++;
        console.error(`  ${product.sku}: ${result}`);
      }
    } catch (err) {
      failed++;
      console.error(
        `  ${product.sku}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
  console.log(`Done. created=${created} updated=${updated} failed=${failed}`);
  await pool.end();
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
