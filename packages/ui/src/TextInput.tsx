import React from "react";

type TextInputProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "inherit",
  fontSize: 15,
  color: "var(--ink-900)",
  background: "#fff",
  border: "1.5px solid var(--ink-300)",
  borderRadius: "var(--radius-md)",
  padding: "12px 14px",
  outline: "none",
  maxWidth: 420,
};

export function TextInput({
  id,
  label,
  hint,
  error,
  multiline = false,
  rows = 3,
  value,
  onChange,
  placeholder,
  inputMode,
}: TextInputProps) {
  const invalid = Boolean(error);
  const border = invalid ? "1.5px solid var(--danger)" : fieldStyle.border;
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...fieldStyle, border, resize: "vertical" }}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          inputMode={inputMode}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...fieldStyle, border }}
        />
      )}
      {error ? (
        <div style={{ fontSize: 13, color: "var(--danger)", marginTop: 6 }}>
          {error}
        </div>
      ) : hint ? (
        <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 6 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}
