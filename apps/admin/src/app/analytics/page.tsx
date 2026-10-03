"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { DataTable } from "@/components/DataTable";
import { api, naira } from "@/lib/api";

type Funnel = {
  users: number;
  withProfile: number;
  assessed: number;
  plans: number;
  activeSessions7d: number;
  activeCheckins7d: number;
  paidOrders: number;
  revenueMinor: number;
  repeatBuyers: number;
};

type Cohort = { week: string; signups: number; retained7d: number };

export default function AnalyticsPage() {
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Funnel>("/v1/admin/analytics/funnel"),
      api<Cohort[]>("/v1/admin/analytics/cohorts"),
    ]).then(
      ([f, c]) => {
        setFunnel(f);
        setCohorts(c);
      },
      (e: Error) => setError(e.message),
    );
  }, []);

  const steps = funnel
    ? [
        ["Discover → signup", funnel.users],
        ["Profile", funnel.withProfile],
        ["Assessed", funnel.assessed],
        ["Plan generated", funnel.plans],
        ["Active sessions (7d)", funnel.activeSessions7d],
        ["Active check-ins (7d)", funnel.activeCheckins7d],
        ["Paid orders", funnel.paidOrders],
        ["Repeat buyers", funnel.repeatBuyers],
      ]
    : [];

  return (
    <AdminShell title="Analytics">
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <h3>Funnel</h3>
      <DataTable
        columns={[
          { key: "step", label: "Step" },
          { key: "count", label: "Count" },
          {
            key: "rate",
            label: "of signups",
            render: (r) =>
              funnel && funnel.users > 0
                ? `${Math.round(((r.count as number) / funnel.users) * 100)}%`
                : "—",
          },
        ]}
        rows={steps.map(([step, count]) => ({ step, count }))}
      />
      {funnel ? <p>Revenue: {naira(funnel.revenueMinor, "NGN")}</p> : null}
      <h3>Weekly cohorts (7-day check-in retention)</h3>
      <DataTable
        columns={[
          { key: "week", label: "Week" },
          { key: "signups", label: "Signups" },
          { key: "retained7d", label: "Retained" },
          {
            key: "rate",
            label: "Rate",
            render: (r) =>
              (r.signups as number) > 0
                ? `${Math.round(((r.retained7d as number) / (r.signups as number)) * 100)}%`
                : "—",
          },
        ]}
        rows={cohorts as unknown as Record<string, unknown>[]}
      />
    </AdminShell>
  );
}
