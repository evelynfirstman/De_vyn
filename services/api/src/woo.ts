/**
 * Pure WooCommerce bridge helpers (Phase 7).
 *
 * Kept free of I/O so bundle resolution, payload shaping and tracking
 * parsing can be unit tested without a DB or a live Woo store.
 */

export type LineItem = { sku: string; qty: number };

export type ShippingInfo = {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  email?: string;
};

export type BundleMode = "expand" | "as-is";

/**
 * Turn ordered line items into the physical lines the warehouse ships.
 * `expand` (default) replaces a bundle SKU with its member SKUs, so
 * TeemDrop never needs a kit product; `as-is` mirrors the catalog 1:1.
 * Quantities are aggregated per SKU, preserving first-seen order.
 */
export function resolveLineItems(
  items: LineItem[],
  membershipsBySku: Map<string, LineItem[]>,
  mode: BundleMode,
): LineItem[] {
  const qtyBySku = new Map<string, number>();
  const order: string[] = [];
  const add = (sku: string, qty: number): void => {
    if (!qtyBySku.has(sku)) order.push(sku);
    qtyBySku.set(sku, (qtyBySku.get(sku) ?? 0) + qty);
  };
  for (const item of items) {
    const members =
      mode === "expand" ? membershipsBySku.get(item.sku) : undefined;
    if (members !== undefined && members.length > 0) {
      for (const member of members) add(member.sku, member.qty * item.qty);
    } else {
      add(item.sku, item.qty);
    }
  }
  return order.map((sku) => ({ sku, qty: qtyBySku.get(sku) ?? 0 }));
}

/** Shape a paid Vyn order into a WooCommerce order creation body. */
export function buildWooOrderPayload(
  orderId: number,
  shipping: ShippingInfo,
  lineItems: LineItem[],
): Record<string, unknown> {
  const name =
    shipping.name !== undefined && shipping.name !== ""
      ? shipping.name
      : "Vyn customer";
  return {
    payment_method: "flutterwave",
    payment_method_title: "Flutterwave",
    set_paid: true,
    billing: {
      first_name: name,
      phone: shipping.phone ?? "",
      address_1: shipping.address ?? "",
      city: shipping.city ?? "",
      country: shipping.country ?? "",
      email: shipping.email ?? "",
    },
    shipping: {
      first_name: name,
      address_1: shipping.address ?? "",
      city: shipping.city ?? "",
      country: shipping.country ?? "",
    },
    line_items: lineItems.map((i) => ({ sku: i.sku, quantity: i.qty })),
    meta_data: [{ key: "vyn_order_id", value: String(orderId) }],
  };
}

export type WooTracking = {
  wooStatus: string | null;
  fulfilled: boolean;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value !== "") return value;
  if (typeof value === "number") return String(value);
  return null;
}

/**
 * Derive fulfillment state from a WooCommerce order. TeemDrop pushes
 * shipment info back as order meta (the Shipment Tracking plugin's
 * `_wc_shipment_tracking_items`, or plain `vyn_*` keys set by a hook).
 */
export function parseWooTracking(woo: {
  status?: unknown;
  meta_data?: unknown;
}): WooTracking {
  const wooStatus = asString(woo.status);
  const meta = new Map<string, unknown>();
  if (Array.isArray(woo.meta_data)) {
    for (const entry of woo.meta_data) {
      const record = asRecord(entry);
      const key = asString(record.key);
      if (key !== null) meta.set(key, record.value);
    }
  }

  const firstItem = Array.isArray(meta.get("_wc_shipment_tracking_items"))
    ? asRecord((meta.get("_wc_shipment_tracking_items") as unknown[])[0])
    : {};

  const trackingNumber =
    asString(meta.get("vyn_tracking_number")) ??
    asString(meta.get("_tracking_number")) ??
    asString(firstItem.tracking_number);
  const trackingUrl =
    asString(meta.get("vyn_tracking_url")) ??
    asString(meta.get("_tracking_link")) ??
    asString(firstItem.tracking_url);
  const carrier =
    asString(meta.get("vyn_carrier")) ??
    asString(meta.get("_tracking_provider")) ??
    asString(firstItem.tracking_provider);

  return {
    wooStatus,
    fulfilled: wooStatus === "completed" || meta.get("vyn_fulfilled") === true,
    trackingNumber,
    trackingUrl,
    carrier,
  };
}
