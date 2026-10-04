import React from "react";

export function MetricPod({
  label,
  value,
  unit,
  tone = "high",
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "high" | "mid" | "low";
}) {
  const strip =
    tone === "high"
      ? "var(--score-high)"
      : tone === "mid"
        ? "var(--score-mid)"
        : "var(--score-low)";
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--ink-100)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--elevation-1)",
        flex: "1 1 0",
        minWidth: 0,
      }}
    >
      <div style={{ height: 4, background: strip }} />
      <div style={{ padding: "12px 14px" }}>
        <div
          style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)" }}
        >
          {label}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-900)" }}>
          {value}{" "}
          {unit ? (
            <span style={{ fontSize: 13, color: "var(--ink-500)" }}>
              {unit}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function RegionBar({
  label,
  percent,
  caption,
}: {
  label: string;
  percent: number;
  caption?: string;
}) {
  const tone =
    percent >= 80
      ? "var(--score-high)"
      : percent >= 50
        ? "var(--tertiary-container)"
        : "var(--score-low)";
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          marginBottom: 6,
        }}
      >
        <span style={{ fontWeight: 600, color: "var(--ink-900)" }}>
          {label}
        </span>
        <span
          style={{
            background: "var(--surface-low)",
            borderRadius: 999,
            padding: "2px 8px",
            fontWeight: 700,
            color: "var(--ink-700)",
          }}
        >
          {percent}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} recovery ${percent} percent`}
        style={{
          height: 8,
          borderRadius: 999,
          background: "var(--surface-container)",
          overflow: "hidden",
        }}
      >
        <div
          style={{ width: `${percent}%`, height: "100%", background: tone }}
        />
      </div>
      {caption ? (
        <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 4 }}>
          {caption}
        </div>
      ) : null}
    </div>
  );
}

export function StreakDots({
  days = 7,
  active = 7,
}: {
  days?: number;
  active?: number;
}) {
  return (
    <div style={{ display: "flex", gap: 6 }} aria-label={`${active} day streak`}>
      {Array.from({ length: days }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background:
              i < active ? "var(--brand-500)" : "var(--secondary-container)",
          }}
        />
      ))}
    </div>
  );
}

export function RoutineHeroCard({
  title,
  meta,
  cta,
  onCta,
}: {
  title: string;
  meta: string;
  cta: string;
  onCta?: () => void;
}) {
  return (
    <div
      style={{
        background: "var(--brand-900)",
        color: "#fff",
        borderRadius: "var(--radius-xl)",
        padding: 20,
        boxShadow: "var(--elevation-2)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--primary-fixed)",
          marginBottom: 8,
        }}
      >
        Prescribed routine
      </div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{meta}</div>
      <button
        onClick={onCta}
        style={{
          marginTop: 16,
          background: "var(--brand-500)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius)",
          padding: "12px 20px",
          fontFamily: "var(--font)",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          minHeight: 44,
        }}
      >
        {cta}
      </button>
    </div>
  );
}
