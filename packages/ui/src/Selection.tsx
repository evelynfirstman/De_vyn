import React from "react";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{
        display: "grid",
        gridAutoFlow: "column",
        gridAutoColumns: "1fr",
        gap: 4,
        background: "var(--surface-container)",
        padding: 6,
        borderRadius: "var(--radius-md)",
      }}
    >
      {options.map((o) => {
        const selected = o === value;
        return (
          <button
            key={o}
            aria-pressed={selected}
            onClick={() => onChange(o)}
            style={{
              border: selected
                ? "1px solid rgba(18,131,111,0.2)"
                : "1px solid transparent",
              background: selected ? "#fff" : "transparent",
              boxShadow: selected ? "0 1px 2px rgba(16,24,40,0.06)" : "none",
              borderRadius: "var(--radius)",
              padding: "8px 12px",
              minHeight: 44,
              cursor: "pointer",
              fontFamily: "var(--font)",
              fontSize: 14,
              fontWeight: 600,
              color: selected ? "var(--ink-900)" : "var(--ink-500)",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function SelectableCard({
  selected,
  onToggle,
  title,
  description,
  icon,
  badge,
}: {
  selected: boolean;
  onToggle: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
}) {
  return (
    <button
      aria-pressed={selected}
      onClick={onToggle}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        textAlign: "left",
        width: "100%",
        background: selected ? "#F0F9F6" : "#fff",
        border: selected
          ? "2px solid var(--brand-500)"
          : "1px solid var(--ink-100)",
        boxShadow: selected
          ? "0 4px 14px -2px rgba(18, 131, 111, 0.12)"
          : "none",
        borderRadius: "var(--radius-lg)",
        padding: 16,
        cursor: "pointer",
        fontFamily: "var(--font)",
        minHeight: 44,
      }}
    >
      {icon ? (
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--surface-low)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      ) : null}
      <span style={{ flex: 1 }}>
        <span
          style={{ display: "block", fontWeight: 600, color: "var(--ink-900)" }}
        >
          {title}{" "}
          {badge ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: "var(--brand-100)",
                color: "var(--brand-900)",
                borderRadius: 999,
                padding: "2px 8px",
                marginLeft: 8,
              }}
            >
              {badge}
            </span>
          ) : null}
        </span>
        {description ? (
          <span
            style={{
              display: "block",
              fontSize: 13,
              color: "var(--ink-500)",
              marginTop: 4,
            }}
          >
            {description}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden
        style={{
          width: 24,
          height: 24,
          borderRadius: selected ? 8 : "50%",
          background: selected ? "var(--brand-500)" : "#fff",
          border: selected
            ? "2px solid var(--brand-500)"
            : "2px solid var(--ink-300)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {selected ? "✓" : ""}
      </span>
    </button>
  );
}
