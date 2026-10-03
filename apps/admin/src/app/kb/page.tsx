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

type Doc = {
  id: number;
  title: string;
  source: string;
  status: string;
};

export default function KbPage() {
  const [filter, setFilter] = useState("");
  const [rows, setRows] = useState<Doc[]>([]);
  const [form, setForm] = useState({ title: "", body: "", source: "" });
  const [error, setError] = useState<string | null>(null);

  async function load(f: string) {
    setError(null);
    try {
      const data = await api<Doc[]>(`/v1/admin/kb${f ? `?status=${f}` : ""}`);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    void load(filter);
  }, [filter]);

  async function review(id: number, status: "approved" | "rejected") {
    try {
      await api(`/v1/admin/kb/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      await load(filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    }
  }

  async function create() {
    try {
      await api("/v1/admin/kb", {
        method: "POST",
        body: JSON.stringify({ ...form }),
      });
      setForm({ title: "", body: "", source: "" });
      await load(filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  }

  return (
    <AdminShell title="AI KB — review queue">
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <div style={{ marginBottom: 16 }}>
        {["", "draft", "approved", "rejected"].map((s) => (
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
          { key: "title", label: "Title" },
          { key: "source", label: "Source" },
          { key: "status", label: "Status" },
          {
            key: "actions",
            label: "",
            render: (r) => (
              <>
                <button
                  style={btnPrimary}
                  onClick={() => void review(r.id as number, "approved")}
                >
                  Approve
                </button>
                <button
                  style={btnDanger}
                  onClick={() => void review(r.id as number, "rejected")}
                >
                  Reject
                </button>
              </>
            ),
          },
        ]}
        rows={rows as unknown as Record<string, unknown>[]}
      />
      <h3>New document</h3>
      <div style={card}>
        {(["title", "source"] as const).map((k) => (
          <input
            key={k}
            style={inputStyle}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            placeholder={k}
          />
        ))}
        <textarea
          style={{ ...inputStyle, minHeight: 80 }}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          placeholder="body"
        />
        <button style={btnPrimary} onClick={() => void create()}>
          Create draft
        </button>
      </div>
    </AdminShell>
  );
}
