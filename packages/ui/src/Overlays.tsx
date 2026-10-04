import React from "react";

export function QrScannerModal({
  open,
  onClose,
  onSimulate,
}: {
  open: boolean;
  onClose: () => void;
  onSimulate?: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan hardware QR code"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(41, 48, 65, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "var(--radius-xl)",
          padding: 20,
          maxWidth: 340,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 192,
            height: 192,
            margin: "0 auto 16px",
            borderRadius: "var(--radius-lg)",
            background: "var(--brand-900)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              top: "50%",
              height: 2,
              background:
                "linear-gradient(90deg, transparent, var(--accent-500), transparent)",
              boxShadow: "0 0 12px var(--accent-500)",
            }}
          />
          <div style={{ color: "#fff", paddingTop: 80, fontSize: 13 }}>
            Point camera at QR
          </div>
        </div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          Scan hardware QR code
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 16 }}>
          Unlocks instant guides &amp; paired protocols.
        </p>
        <button
          onClick={onSimulate ?? onClose}
          style={{
            width: "100%",
            background: "var(--brand-500)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "12px",
            fontFamily: "var(--font)",
            fontWeight: 600,
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          Simulate successful scan
        </button>
      </div>
    </div>
  );
}

export function Toast({
  message,
}: {
  message: string;
}) {
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: 88,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--inverse-surface)",
        color: "var(--inverse-on-surface)",
        borderRadius: "var(--radius-md)",
        padding: "10px 16px",
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "var(--elevation-2)",
        zIndex: 40,
      }}
    >
      {message}
    </div>
  );
}

export function OnboardingShell({
  step,
  total,
  title,
  subtitle,
  children,
  cta,
  onCta,
  footnote = "HIPAA-aware · Your data stays private",
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  cta: string;
  onCta?: () => void;
  footnote?: string;
}) {
  const pct = Math.round((step / total) * 100);
  return (
    <div style={{ maxWidth: 430, margin: "0 auto", background: "#fff" }}>
      <div style={{ padding: "12px 16px", position: "sticky", top: 0, background: "#fff", zIndex: 5 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)" }}>
          Step {step}/{total}
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            height: 6,
            borderRadius: 999,
            background: "var(--ink-100)",
            marginTop: 8,
            overflow: "hidden",
          }}
        >
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--brand-500)" }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "12px 0 4px" }}>{title}</h1>
        {subtitle ? (
          <p style={{ fontSize: 15, color: "var(--ink-500)", margin: 0 }}>{subtitle}</p>
        ) : null}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid var(--ink-100)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
          padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
        }}
      >
        <button
          onClick={onCta}
          style={{
            width: "100%",
            background: "var(--brand-500)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "14px",
            fontFamily: "var(--font)",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            minHeight: 52,
          }}
        >
          {cta}
        </button>
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--ink-500)", marginTop: 8 }}>
          {footnote}
        </div>
      </div>
    </div>
  );
}
