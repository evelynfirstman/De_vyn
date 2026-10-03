"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { DataTable, btnPrimary } from "@/components/DataTable";
import { api } from "@/lib/api";

type Ticket = {
  id: number;
  email: string;
  subject: string;
  message: string;
  status: string;
};

export default function SupportPage() {
  const [filter, setFilter] = useState("");
  const [rows, setRows] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(f: string) {
    setError(null);
    try {
      setRows(
        await api<Ticket[]>(`/v1/admin/tickets${f ? `?status=${f}` : ""}`),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    void load(filter);
  }, [filter]);

  async function resolve(id: number) {
    try {
      await api(`/v1/admin/tickets/${id}/resolve`, { method: "POST" });
      await load(filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resolve failed");
    }
  }

  return (
    <AdminShell title="Customer support">
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <div style={{ marginBottom: 16 }}>
        {["", "open", "resolved"].map((s) => (
          <button
            key={s || "all"}
            style={{
              ...btnPrimary,
              background: filter === s ? "var(--brand-500)" : "var(--ink-300)",
            }}
            onClick={() => setFilter(s)}
          >
            {s || "all"}
          </button>
        ))}
      </div>
      <DataTable
        columns={[
          { key: "id", label: "ID" },
          { key: "email", label: "User" },
          { key: "subject", label: "Subject" },
          { key: "message", label: "Message" },
          { key: "status", label: "Status" },
          {
            key: "actions",
            label: "",
            render: (r) =>
              (r.status as string) === "open" ? (
                <button
                  style={btnPrimary}
                  onClick={() => void resolve(r.id as number)}
                >
                  Resolve
                </button>
              ) : (
                "—"
              ),
          },
        ]}
        rows={rows as unknown as Record<string, unknown>[]}
      />
    </AdminShell>
  );
}
