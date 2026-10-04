"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { btnPrimary, card, inputStyle } from "@/components/DataTable";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@vyntherapy.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await authClient.signIn.email({ email, password });
      if (res.error) throw new Error(res.error.message ?? "Sign in failed");
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1>Vyn Admin — sign in</h1>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <div style={card}>
        <input
          style={inputStyle}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          style={inputStyle}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
        />
        <button
          style={btnPrimary}
          onClick={() => void submit()}
          disabled={busy}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
