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
import { api } from "@/lib/api";

type Qr = {
  code: string;
  kind: string;
  ref: string;
  scans: number;
};

export default function QrPage() {
  const [rows, setRows] = useState<Qr[]>([]);
  const [form, setForm] = useState({ kind: "program", ref: "" });
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setRows(await api<Qr[]>("/v1/admin/qr"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function create() {
    setError(null);
    try {
      await api("/v1/admin/qr", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ kind: "program", ref: "" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  }

  async function revoke(code: string) {
    try {
      await api(`/v1/admin/qr/${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revoke failed");
    }
  }

  return (
    <AdminShell title="QR codes">
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <DataTable
        columns={[
          { key: "code", label: "Code" },
          { key: "kind", label: "Kind" },
          { key: "ref", label: "Ref" },
          { key: "scans", label: "Scans" },
          {
            key: "actions",
            label: "",
            render: (r) => (
              <button
                style={btnDanger}
                onClick={() => void revoke(r.code as string)}
              >
                Revoke
              </button>
            ),
          },
        ]}
        rows={rows as unknown as Record<string, unknown>[]}
      />
      <h3>New code</h3>
      <div style={card}>
        <select
          style={inputStyle}
          value={form.kind}
          onChange={(e) => setForm({ ...form, kind: e.target.value })}
        >
          <option value="program">program</option>
          <option value="product">product</option>
        </select>
        <input
          style={inputStyle}
          value={form.ref}
          onChange={(e) => setForm({ ...form, ref: e.target.value })}
          placeholder="ref (slug or sku)"
        />
        <button style={btnPrimary} onClick={() => void create()}>
          Generate
        </button>
      </div>
    </AdminShell>
  );
}
