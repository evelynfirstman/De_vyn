"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { api, naira } from "@/lib/api";

type Overview = {
  users: number;
  plans: number;
  completions30d: number;
  paidOrders: number;
  revenueMinor: number;
  weeklyActive: number;
};

const CARDS: {
  key: keyof Overview;
  label: string;
  format?: (v: number) => string;
}[] = [
  { key: "users", label: "Users" },
  { key: "plans", label: "Recovery plans" },
  { key: "completions30d", label: "Sessions (30d)" },
  { key: "paidOrders", label: "Paid orders" },
  {
    key: "revenueMinor",
    label: "Revenue",
    format: (v) => naira(v, "NGN"),
  },
  { key: "weeklyActive", label: "Active (7d)" },
];

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Overview>("/v1/admin/overview").then(setOverview, (e: Error) =>
      setError(e.message),
    );
  }, []);

  return (
    <AdminShell title="Dashboard">
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {overview
          ? CARDS.map((c) => (
              <div
                key={c.key}
                style={{
                  background: "#fff",
                  border: "1px solid var(--ink-100)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 13, color: "var(--ink-500)" }}>
                  {c.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>
                  {c.format ? c.format(overview[c.key]) : overview[c.key]}
                </div>
              </div>
            ))
          : "Loading…"}
      </div>
      <p>
        Funnel detail: <Link href="/analytics">Analytics</Link> · Pending work:{" "}
        <Link href="/support">Support tickets</Link> · Review queue:{" "}
        <Link href="/kb">AI KB</Link>
      </p>
    </AdminShell>
  );
}
