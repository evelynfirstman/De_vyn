"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { authClient, type SessionUser } from "@/lib/auth-client";

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
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    authClient
      .getSession()
      .then((s) => setUser((s?.data?.user as SessionUser | undefined) ?? null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user === null) router.replace("/login");
  }, [user, router]);

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
  }

  if (user === undefined)
    return <p style={{ padding: 32 }}>Checking session…</p>;
  if (user === null)
    return <p style={{ padding: 32 }}>Redirecting to login…</p>;
  if ((user.role ?? "user") !== "admin") {
    return (
      <div style={{ padding: 32 }}>
        <h1>Forbidden</h1>
        <p>
          Signed in as {user.email}, which is not an admin.{" "}
          <button onClick={signOut}>Sign out</button>
        </p>
      </div>
    );
  }

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
        <button
          onClick={() => void signOut()}
          style={{
            marginTop: "auto",
            background: "transparent",
            border: "1px solid rgba(255,255,255,.4)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Sign out ({user.email})
        </button>
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
