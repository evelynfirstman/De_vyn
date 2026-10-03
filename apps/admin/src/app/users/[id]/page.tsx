"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { DataTable, card } from "@/components/DataTable";
import { api } from "@/lib/api";

type UserDetail = {
  user: { id: number; email: string; name: string };
  profile: { goals: string[]; painAreas: string[] } | null;
  latestPlan: {
    items: { day: string; title: string }[];
    rationale: string;
  } | null;
  scores: { date: string; score: number; band: string }[];
  orders: { id: number; status: string }[];
  tickets: { id: number; subject: string; status: string }[];
};

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<UserDetail>(`/v1/admin/users/${params.id}`).then(
      setDetail,
      (e: Error) => setError(e.message),
    );
  }, [params.id]);

  return (
    <AdminShell title={`User #${params.id}`}>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      {!detail ? (
        <p>Loading…</p>
      ) : (
        <>
          <div style={card}>
            <b>{detail.user.email}</b> ({detail.user.name ?? "—"})
            <div style={{ color: "var(--ink-500)", fontSize: 14 }}>
              Pains: {(detail.profile?.painAreas ?? []).join(", ") || "—"} ·
              Goals: {(detail.profile?.goals ?? []).join(", ") || "—"}
            </div>
          </div>
          <h3>Latest plan</h3>
          <p style={{ fontSize: 14 }}>
            {detail.latestPlan
              ? detail.latestPlan.items
                  .map((i) => `${i.day}: ${i.title}`)
                  .join(" · ")
              : "No plan yet."}
          </p>
          <h3>Recent scores</h3>
          <DataTable
            columns={[
              { key: "date", label: "Date" },
              { key: "score", label: "Score" },
              { key: "band", label: "Band" },
            ]}
            rows={detail.scores as unknown as Record<string, unknown>[]}
          />
          <h3>Orders & tickets</h3>
          <DataTable
            columns={[
              { key: "id", label: "ID" },
              { key: "status", label: "Status" },
            ]}
            rows={[
              ...detail.orders.map((o) => ({
                id: o.id,
                status: `order ${o.status}`,
              })),
              ...detail.tickets.map((t) => ({
                id: t.id,
                status: `ticket ${t.status}: ${t.subject}`,
              })),
            ]}
          />
        </>
      )}
    </AdminShell>
  );
}
