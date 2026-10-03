import Link from "next/link";
import type { ReactNode } from "react";

const LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/programs", label: "Programs" },
  { href: "/content", label: "Content" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/kb", label: "AI KB" },
  { href: "/qr", label: "QR" },
  { href: "/notifications", label: "Notifications" },
  { href: "/analytics", label: "Analytics" },
  { href: "/support", label: "Support" },
  { href: "/design", label: "Design system" },
];

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav
        style={{
          width: 220,
          background: "var(--brand-900)",
          color: "#fff",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>
          Vyn Admin
        </div>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              color: "#fff",
              textDecoration: "none",
              padding: "8px 12px",
              borderRadius: 8,
              opacity: 0.9,
            }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <main style={{ flex: 1, padding: "32px", maxWidth: 1100 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
