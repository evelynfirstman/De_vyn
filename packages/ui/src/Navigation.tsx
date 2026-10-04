import React from "react";

export function AppHeader({
  title,
  right,
  onMenu,
}: {
  title: string;
  right?: React.ReactNode;
  onMenu?: () => void;
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: "rgba(249, 249, 255, 0.8)",
        borderBottom: "1px solid var(--ink-100)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <button
        aria-label="Open menu"
        onClick={onMenu}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "var(--surface-container)",
          border: "1px solid var(--ink-100)",
          cursor: "pointer",
          fontSize: 18,
        }}
      >
        ☰
      </button>
      <div style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>{title}</div>
      {right}
    </header>
  );
}

const tabs = ["Home", "Recover", "Learn", "Shop", "Progress"] as const;
export type AppTab = (typeof tabs)[number];

export function BottomNav({
  active,
  onChange,
}: {
  active: AppTab;
  onChange?: (tab: AppTab) => void;
}) {
  return (
    <nav
      aria-label="Primary"
      style={{
        display: "flex",
        position: "sticky",
        bottom: 0,
        background: "#fff",
        borderTop: "1px solid var(--ink-100)",
        boxShadow: "var(--elevation-nav, 0 -2px 12px rgba(0,0,0,0.03))",
        padding: "8px 4px calc(8px + env(safe-area-inset-bottom))",
      }}
    >
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <button
            key={t}
            onClick={() => onChange?.(t)}
            aria-current={isActive ? "page" : undefined}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontFamily: "var(--font)",
              fontSize: 12,
              fontWeight: 600,
              color: isActive ? "var(--brand-500)" : "var(--ink-500)",
              padding: "8px 4px",
              minHeight: 44,
            }}
          >
            <div style={{ fontSize: 20 }}>
              {t === "Home"
                ? "⌂"
                : t === "Recover"
                  ? "◉"
                  : t === "Learn"
                    ? "▶"
                    : t === "Shop"
                      ? "◈"
                      : "▲"}
            </div>
            {t}
          </button>
        );
      })}
    </nav>
  );
}
