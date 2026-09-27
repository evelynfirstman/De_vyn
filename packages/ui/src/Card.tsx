import React from "react";

type SectionCardProps = {
  title: string;
  sub?: string;
  children: React.ReactNode;
};

export function SectionCard({ title, sub, children }: SectionCardProps) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid var(--ink-100)",
        borderRadius: "var(--radius-lg)",
        padding: 28,
        marginBottom: 24,
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        {title}
      </h2>
      {sub ? (
        <p style={{ color: "var(--ink-500)", fontSize: 14, marginBottom: 20 }}>
          {sub}
        </p>
      ) : null}
      {children}
    </section>
  );
}
