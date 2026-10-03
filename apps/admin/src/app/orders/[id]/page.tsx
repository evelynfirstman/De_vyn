"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { DataTable, btnPrimary, card } from "@/components/DataTable";
import { api, naira } from "@/lib/api";

type OrderDetail = {
  id: number;
  email: string;
  status: string;
  amountMinor: number;
  currency: string;
  shipping: Record<string, string>;
  paymentStatus: string | null;
  txRef: string | null;
  fulfillmentStatus: string | null;
  bridgeRef: string | null;
  fulfillmentError: string | null;
  items: { sku: string; title: string; qty: number; unitMinor: number }[];
};

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api<OrderDetail>(`/v1/admin/orders/${params.id}`);
      setOrder(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    void load();
  }, [params.id]);

  async function refund() {
    setError(null);
    setMsg(null);
    try {
      await api(`/v1/admin/orders/${params.id}/refund`, { method: "POST" });
      setMsg("Refunded ✓");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refund failed");
    }
  }

  return (
    <AdminShell title={`Order #${params.id}`}>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      {msg ? <p>{msg}</p> : null}
      {!order ? (
        <p>Loading…</p>
      ) : (
        <>
          <div style={card}>
            <b>{order.email}</b> · {order.status} ·{" "}
            {naira(order.amountMinor, order.currency)}
            <div style={{ fontSize: 14, color: "var(--ink-500)" }}>
              pay: {order.paymentStatus ?? "—"} ({order.txRef ?? "no tx"}) ·
              ship: {order.fulfillmentStatus ?? "—"}
              {order.bridgeRef ? ` (${order.bridgeRef})` : ""}
              {order.fulfillmentError
                ? ` · err: ${order.fulfillmentError}`
                : ""}
            </div>
            <div style={{ fontSize: 14, color: "var(--ink-500)" }}>
              {order.shipping?.name} · {order.shipping?.address},{" "}
              {order.shipping?.city} {order.shipping?.country}
            </div>
          </div>
          <DataTable
            columns={[
              { key: "sku", label: "SKU" },
              { key: "title", label: "Title" },
              { key: "qty", label: "Qty" },
            ]}
            rows={order.items as unknown as Record<string, unknown>[]}
          />
          <button style={btnPrimary} onClick={() => void refund()}>
            Refund (live keys only)
          </button>
        </>
      )}
    </AdminShell>
  );
}
