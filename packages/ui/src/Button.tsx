import React from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "kinetic";

type ButtonProps = {
  variant?: ButtonVariant;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
};

const base: React.CSSProperties = {
  fontFamily: "var(--font)",
  fontSize: 14,
  fontWeight: 600,
  padding: "12px 24px",
  borderRadius: "var(--radius)",
  border: "1px solid transparent",
  cursor: "pointer",
  minHeight: 44,
};

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "var(--brand-500)", color: "#fff" },
  secondary: {
    background: "#fff",
    borderColor: "var(--ink-100)",
    color: "var(--ink-900)",
  },
  outline: {
    background: "transparent",
    borderColor: "var(--brand-500)",
    color: "var(--brand-700)",
  },
  danger: { background: "var(--danger)", color: "#fff" },
  kinetic: { background: "var(--accent-500)", color: "#fff" },
};

export function Button({
  variant = "primary",
  disabled = false,
  children,
  onClick,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...base,
        ...variants[variant],
        ...(disabled ? { opacity: 0.45, cursor: "not-allowed" } : {}),
      }}
    >
      {children}
    </button>
  );
}
