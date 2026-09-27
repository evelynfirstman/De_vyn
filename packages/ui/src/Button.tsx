import React from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

type ButtonProps = {
  variant?: ButtonVariant;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
};

const base: React.CSSProperties = {
  fontFamily: "inherit",
  fontSize: 15,
  fontWeight: 600,
  padding: "12px 24px",
  borderRadius: "var(--radius-md)",
  border: "1px solid transparent",
  cursor: "pointer",
};

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "var(--brand-500)", color: "#fff" },
  secondary: { background: "var(--brand-100)", color: "var(--brand-900)" },
  outline: {
    background: "transparent",
    borderColor: "var(--brand-500)",
    color: "var(--brand-700)",
  },
  danger: { background: "var(--danger)", color: "#fff" },
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
