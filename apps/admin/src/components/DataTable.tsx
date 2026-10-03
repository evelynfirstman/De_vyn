import type { ReactNode } from "react";

export type Column = {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => ReactNode;
};

function cell(row: Record<string, unknown>, key: string): ReactNode {
  const v = row[key];
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function DataTable({
  columns,
  rows,
  empty = "Nothing here yet.",
}: {
  columns: Column[];
  rows: Record<string, unknown>[];
  empty?: string;
}) {
  if (rows.length === 0)
    return <p style={{ color: "var(--ink-500)" }}>{empty}</p>;
  return (
    <div
      style={{
        overflowX: "auto",
        background: "#fff",
        borderRadius: 12,
        border: "1px solid var(--ink-100)",
      }}
    >
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
      >
        <thead>
          <tr style={{ textAlign: "left", background: "var(--ink-50)" }}>
            {columns.map((c) => (
              <th key={c.key} style={{ padding: "10px 12px" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--ink-100)" }}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  style={{ padding: "10px 12px", verticalAlign: "top" }}
                >
                  {c.render ? c.render(row) : cell(row, c.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid var(--ink-100)",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
};

export const inputStyle: React.CSSProperties = {
  fontFamily: "inherit",
  fontSize: 14,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1.5px solid var(--ink-300)",
  width: "100%",
  marginBottom: 8,
};

export const btnPrimary: React.CSSProperties = {
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 700,
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: "var(--brand-500)",
  color: "#fff",
  cursor: "pointer",
  marginRight: 8,
};

export const btnDanger: React.CSSProperties = {
  ...btnPrimary,
  background: "var(--danger)",
};
