import { describe, expect, it } from "vitest";
import {
  buildWooOrderPayload,
  parseWooTracking,
  resolveLineItems,
  type LineItem,
} from "./woo";

describe("resolveLineItems (Phase 7 bridge)", () => {
  const memberships = new Map<string, LineItem[]>([
    [
      "VYN-BACK-001",
      [
        { sku: "VYN-NECK-001", qty: 1 },
        { sku: "VYN-BAND-001", qty: 2 },
      ],
    ],
  ]);

  it("passes plain items through unchanged", () => {
    expect(
      resolveLineItems([{ sku: "VYN-MAT", qty: 1 }], memberships, "expand"),
    ).toEqual([{ sku: "VYN-MAT", qty: 1 }]);
  });

  it("expands a bundle into its members scaled by quantity", () => {
    expect(
      resolveLineItems(
        [{ sku: "VYN-BACK-001", qty: 2 }],
        memberships,
        "expand",
      ),
    ).toEqual([
      { sku: "VYN-NECK-001", qty: 2 },
      { sku: "VYN-BAND-001", qty: 4 },
    ]);
  });

  it("aggregates overlapping member and direct lines", () => {
    expect(
      resolveLineItems(
        [
          { sku: "VYN-BACK-001", qty: 1 },
          { sku: "VYN-NECK-001", qty: 3 },
        ],
        memberships,
        "expand",
      ),
    ).toEqual([
      { sku: "VYN-NECK-001", qty: 4 },
      { sku: "VYN-BAND-001", qty: 2 },
    ]);
  });

  it("keeps the parent SKU in as-is mode", () => {
    expect(
      resolveLineItems([{ sku: "VYN-BACK-001", qty: 2 }], memberships, "as-is"),
    ).toEqual([{ sku: "VYN-BACK-001", qty: 2 }]);
  });

  it("returns empty for no items", () => {
    expect(resolveLineItems([], memberships, "expand")).toEqual([]);
  });
});

describe("buildWooOrderPayload", () => {
  it("marks the order paid and stamps the vyn_order_id meta", () => {
    const payload = buildWooOrderPayload(
      42,
      { name: "Ada", city: "Lagos", country: "NG" },
      [{ sku: "VYN-NECK-001", qty: 2 }],
    );
    expect(payload.set_paid).toBe(true);
    expect(payload.line_items).toEqual([{ sku: "VYN-NECK-001", quantity: 2 }]);
    expect(payload.meta_data).toEqual([{ key: "vyn_order_id", value: "42" }]);
    expect((payload.billing as Record<string, unknown>).first_name).toBe("Ada");
  });

  it("falls back to a placeholder name", () => {
    const payload = buildWooOrderPayload(1, {}, []);
    expect((payload.billing as Record<string, unknown>).first_name).toBe(
      "Vyn customer",
    );
  });
});

describe("parseWooTracking", () => {
  it("reads plain vyn_* meta keys", () => {
    const t = parseWooTracking({
      status: "completed",
      meta_data: [
        { key: "vyn_tracking_number", value: "TRK123" },
        { key: "vyn_tracking_url", value: "https://track/TRK123" },
        { key: "vyn_carrier", value: "DHL" },
      ],
    });
    expect(t).toEqual({
      wooStatus: "completed",
      fulfilled: true,
      trackingNumber: "TRK123",
      trackingUrl: "https://track/TRK123",
      carrier: "DHL",
    });
  });

  it("reads the Shipment Tracking plugin shape", () => {
    const t = parseWooTracking({
      status: "processing",
      meta_data: [
        {
          key: "_wc_shipment_tracking_items",
          value: [
            {
              tracking_number: "YT99",
              tracking_url: "https://yt/99",
              tracking_provider: "Yanwen",
            },
          ],
        },
      ],
    });
    expect(t.fulfilled).toBe(false);
    expect(t.trackingNumber).toBe("YT99");
    expect(t.trackingUrl).toBe("https://yt/99");
    expect(t.carrier).toBe("Yanwen");
  });

  it("tolerates missing data", () => {
    expect(parseWooTracking({})).toEqual({
      wooStatus: null,
      fulfilled: false,
      trackingNumber: null,
      trackingUrl: null,
      carrier: null,
    });
  });
});
