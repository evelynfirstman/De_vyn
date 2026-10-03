"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { DataTable } from "@/components/DataTable";
import { api } from "@/lib/api";
import { inputStyle } from "@/components/DataTable";

type UserRow = {
  id: number;
  email: string;
  name: string;
  plans: number;
  orders: number;
};

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(query: string) {
    setError(null);
    try {
      const data = await api<UserRow[]>(
        `/v1/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`,
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
    <AdminShell title="Users">
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(q);
        }}
        style={{ marginBottom: 16, maxWidth: 420 }}
      >
        <input
          style={inputStyle}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email or name…"
        />
      </form>
      <DataTable
        columns={[
          { key: "id", label: "ID" },
          {
            key: "email",
            label: "User",
            render: (r) => (
              <Link href={`/users/${r.id as number}`}>
                {r.email as string} ({(r.name as string) ?? "—"})
              </Link>
            ),
          },
          { key: "plans", label: "Plans" },
          { key: "orders", label: "Orders" },
        ]}
        rows={rows as unknown as Record<string, unknown>[]}
      />
    </AdminShell>
  );
}
