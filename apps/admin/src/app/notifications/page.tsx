"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import {
  DataTable,
  btnPrimary,
  card,
  inputStyle,
} from "@/components/DataTable";
import { api } from "@/lib/api";

type Row = {
  id: number;
  email: string;
  kind: string;
  title: string;
  read: boolean;
};

export default function NotificationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState({ title: "", body: "", broadcast: true });
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    try {
      setRows(await api<Row[]>("/v1/admin/notifications"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function send() {
    setError(null);
    setMsg(null);
    try {
      const data = await api<{ sent: number }>("/v1/admin/notifications", {
        method: "POST",
        body: JSON.stringify({ ...form }),
      });
      setMsg(`Sent to ${data.sent} user(s) ✓`);
      setForm({ title: "", body: "", broadcast: true });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    }
  }

  return (
    <AdminShell title="Notification center">
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      {msg ? <p>{msg}</p> : null}
      <div style={card}>
        <input
          style={inputStyle}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="title"
        />
        <textarea
          style={{ ...inputStyle, minHeight: 60 }}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          placeholder="body"
        />
        <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={form.broadcast}
            onChange={(e) => setForm({ ...form, broadcast: e.target.checked })}
          />{" "}
          Broadcast to all users (uncheck not yet supported per-user — use API)
        </label>
        <button style={btnPrimary} onClick={() => void send()}>
          Send
        </button>
      </div>
      <h3>History</h3>
      <DataTable
        columns={[
          { key: "id", label: "ID" },
          { key: "email", label: "User" },
          { key: "kind", label: "Kind" },
          { key: "title", label: "Title" },
          { key: "read", label: "Read?" },
        ]}
        rows={rows as unknown as Record<string, unknown>[]}
      />
    </AdminShell>
  );
}
