import React from "react";

export type BadgeTone = "low" | "mid" | "high" | "streak" | "neutral";

const tones: Record<BadgeTone, React.CSSProperties> = {
  low: { background: "rgba(229,72,77,.12)", color: "var(--score-low)" },
  mid: { background: "rgba(245,165,36,.15)", color: "#b7791f" },
  high: { background: "rgba(24,169,87,.12)", color: "var(--score-high)" },
  streak: { background: "var(--accent-100)", color: "var(--accent-600)" },
  neutral: { background: "var(--ink-100)", color: "var(--ink-700)" },
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 13,
        fontWeight: 600,
        padding: "4px 12px",
        borderRadius: 999,
        margin: "2px 4px 2px 0",
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}
