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

type Tab = "articles" | "videos";

type Item = {
  id: number;
  slug: string;
  title: string;
  category: string;
};

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>("articles");
  const [rows, setRows] = useState<Item[]>([]);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    category: "recovery",
  });
  const [error, setError] = useState<string | null>(null);

  async function refresh(t: Tab) {
    const items = await api<Item[]>(`/v1/${t}?pageSize=100`);
    setRows(items ?? []);
  }

  useEffect(() => {
    refresh(tab).catch((e: Error) => setError(e.message));
  }, [tab]);

  async function create() {
    setError(null);
    try {
      await api(`/v1/admin/${tab}`, {
        method: "POST",
        body: JSON.stringify({ ...form }),
      });
      setForm({ slug: "", title: "", category: "recovery" });
      await refresh(tab);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  }

  async function remove(id: number) {
    setError(null);
    try {
      await api(`/v1/admin/${tab}/${id}`, { method: "DELETE" });
      await refresh(tab);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <AdminShell title="Content">
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <div style={{ marginBottom: 16 }}>
        {(["articles", "videos"] as Tab[]).map((t) => (
          <button
            key={t}
            style={{
              ...btnPrimary,
              background: tab === t ? "var(--brand-500)" : "var(--ink-300)",
            }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <DataTable
        columns={[
          { key: "id", label: "ID" },
          { key: "slug", label: "Slug" },
          { key: "title", label: "Title" },
          { key: "category", label: "Category" },
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
      <h3>New {tab === "articles" ? "article" : "video"}</h3>
      <div style={card}>
        {(["slug", "title", "category"] as const).map((k) => (
          <input
            key={k}
            style={inputStyle}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            placeholder={k}
          />
        ))}
        <button style={btnPrimary} onClick={() => void create()}>
          Create
        </button>
      </div>
    </AdminShell>
  );
}
