"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { DataTable } from "@/components/DataTable";
import { api, naira } from "@/lib/api";
import { inputStyle } from "@/components/DataTable";

type OrderRow = {
  id: number;
  email: string;
  status: string;
  amountMinor: number;
  currency: string;
  paymentStatus: string | null;
  fulfillmentStatus: string | null;
};

export default function OrdersPage() {
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(s: string) {
    setError(null);
    try {
      const data = await api<OrderRow[]>(
        `/v1/admin/orders${s ? `?status=${s}` : ""}`,
      );
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    void load("");
  }, []);

  return (
    <AdminShell title="Orders">
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(status);
        }}
        style={{ marginBottom: 16, maxWidth: 320 }}
      >
        <select
          style={inputStyle}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending_payment">pending_payment</option>
          <option value="paid">paid</option>
          <option value="cancelled">cancelled</option>
          <option value="fulfilled">fulfilled</option>
        </select>
      </form>
      <DataTable
        columns={[
          {
            key: "id",
            label: "ID",
            render: (r) => (
              <Link href={`/orders/${r.id as number}`}>#{r.id as number}</Link>
            ),
          },
          { key: "email", label: "Customer" },
          { key: "status", label: "Order" },
          {
            key: "amountMinor",
            label: "Total",
            render: (r) => naira(r.amountMinor as number, r.currency as string),
          },
          { key: "paymentStatus", label: "Payment" },
          { key: "fulfillmentStatus", label: "Fulfillment" },
        ]}
        rows={rows as unknown as Record<string, unknown>[]}
      />
    </AdminShell>
  );
}
