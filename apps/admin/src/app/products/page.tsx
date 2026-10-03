"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import {
  DataTable,
  btnDanger,
  btnPrimary,
  card,
  inputStyle,
} from "@/components/DataTable";
import { api, naira } from "@/lib/api";

type Product = {
  id: number;
  sku: string;
  title: string;
  amountMinor: number;
  currency: string;
  isBundle: boolean;
};

export default function ProductsPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [form, setForm] = useState({
    sku: "",
    title: "",
    amountMinor: "",
    problemTags: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const data = await api<Product[]>("/v1/admin/products");
    setRows(data);
  }

  useEffect(() => {
    refresh().catch((e: Error) => setError(e.message));
  }, []);

  async function create() {
    setError(null);
    try {
      await api("/v1/admin/products", {
        method: "POST",
        body: JSON.stringify({
          sku: form.sku,
          title: form.title,
          amountMinor: Number(form.amountMinor),
          problemTags: form.problemTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      setForm({ sku: "", title: "", amountMinor: "", problemTags: "" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  }

  async function remove(id: number) {
    setError(null);
    try {
      await api(`/v1/admin/products/${id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <AdminShell title="Products">
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <DataTable
        columns={[
          { key: "id", label: "ID" },
          { key: "sku", label: "SKU" },
          { key: "title", label: "Title" },
          {
            key: "amountMinor",
            label: "Price",
            render: (r) => naira(r.amountMinor as number, r.currency as string),
          },
          { key: "isBundle", label: "Bundle?" },
          {
            key: "actions",
            label: "",
            render: (r) => (
              <button
                style={btnDanger}
                onClick={() => void remove(r.id as number)}
              >
                Delete
              </button>
            ),
          },
        ]}
        rows={rows as unknown as Record<string, unknown>[]}
      />
      <h3>New product</h3>
      <div style={card}>
        {(["sku", "title", "amountMinor", "problemTags"] as const).map((k) => (
          <input
            key={k}
            style={inputStyle}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            placeholder={k === "amountMinor" ? "amountMinor (e.g. 2500000)" : k}
          />
        ))}
        <button style={btnPrimary} onClick={() => void create()}>
          Create
        </button>
      </div>
    </AdminShell>
  );
}
