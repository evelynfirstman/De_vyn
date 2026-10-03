"use client";

import { useState } from "react";
import { colors } from "@vyn/tokens";
import { Badge, Button, ScoreRing, SectionCard, TextInput } from "@vyn/ui";

const swatches: { name: string; value: string }[] = [
  { name: "Brand 500 · Primary", value: colors.brand[500] },
  { name: "Brand 700 · Hover", value: colors.brand[700] },
  { name: "Brand 900 · Hero", value: colors.brand[900] },
  { name: "Brand 100 · Tint", value: colors.brand[100] },
  { name: "Accent · Streak", value: colors.accent[500] },
  { name: "Ink 900 · Text", value: colors.ink[900] },
  { name: "Ink 500 · Muted", value: colors.ink[500] },
  { name: "Ink 100 · Border", value: colors.ink[100] },
  { name: "Score · Low", value: colors.score.low },
  { name: "Score · Mid", value: colors.score.mid },
  { name: "Score · High", value: colors.score.high },
  { name: "Danger", value: colors.danger },
];

const typeSamples: { label: string; size: number; weight: number }[] = [
  { label: "Display", size: 32, weight: 800 },
  { label: "H1", size: 24, weight: 700 },
  { label: "H2", size: 20, weight: 700 },
  { label: "H3", size: 16, weight: 600 },
  { label: "Body", size: 15, weight: 400 },
  { label: "Caption", size: 13, weight: 400 },
];

export default function DesignSystemPage() {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [goal, setGoal] = useState("");

  const goalNumber = Number(goal);
  const goalError =
    goal !== "" &&
    (goal.trim() === "" ||
      !Number.isInteger(goalNumber) ||
      goalNumber < 1 ||
      goalNumber > 7)
      ? "Enter a number between 1 and 7."
      : undefined;

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
      <header
        style={{
          background:
            "linear-gradient(135deg, var(--brand-900), var(--brand-500))",
          color: "#fff",
          borderRadius: "var(--radius-lg)",
          padding: "40px 32px",
          marginBottom: 32,
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: -0.5,
            margin: 0,
          }}
        >
          Vyn Therapy — Design System
        </h1>
        <p style={{ opacity: 0.85, marginTop: 8, fontSize: 16 }}>
          Phase 1 · tokens from{" "}
          <code style={{ background: "rgba(255,255,255,.2)" }}>
            @vyn/tokens
          </code>
          , components from{" "}
          <code style={{ background: "rgba(255,255,255,.2)" }}>@vyn/ui</code>
        </p>
      </header>

      <SectionCard
        title="1 · Colors"
        sub="Rendered from the tokens.ts single source of truth."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          {swatches.map((s) => (
            <div
              key={s.name}
              style={{
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid var(--ink-100)",
              }}
            >
              <div style={{ height: 64, background: s.value }} />
              <div style={{ padding: "8px 10px", fontSize: 12 }}>
                <b style={{ display: "block", fontSize: 13 }}>{s.name}</b>
                <span
                  style={{ color: "var(--ink-500)", fontFamily: "monospace" }}
                >
                  {s.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="2 · Typography"
        sub="Inter / system stack · tight display tracking."
      >
        {typeSamples.map((t) => (
          <div
            key={t.label}
            style={{
              padding: "12px 0",
              borderBottom: "1px dashed var(--ink-100)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-500)",
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 4,
              }}
            >
              {t.label} · {t.size} / {t.weight}
            </div>
            <div style={{ fontSize: t.size, fontWeight: t.weight }}>
              Recover smarter, every day
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="3 · Buttons"
        sub="Primary, secondary, outline, danger — plus disabled."
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Button>Start session</Button>
          <Button variant="secondary">View plan</Button>
          <Button variant="outline">Browse programs</Button>
          <Button variant="danger">Cancel order</Button>
          <Button disabled>Disabled</Button>
        </div>
      </SectionCard>

      <SectionCard
        title="4 · Sample Inputs"
        sub="Live components — type to try them."
      >
        <TextInput
          id="showcase-name"
          label="Display name"
          hint="Shown on your profile and streak card."
          value={name}
          onChange={setName}
          placeholder="e.g. Adaeze O."
        />
        <TextInput
          id="showcase-note"
          label="Daily check-in note"
          multiline
          value={note}
          onChange={setNote}
          placeholder="How does your neck feel this morning?"
        />
        <TextInput
          id="showcase-goal"
          label="Weekly goal (sessions)"
          error={goalError}
          value={goal}
          onChange={setGoal}
          placeholder="e.g. 4"
          inputMode="numeric"
        />
      </SectionCard>

      <SectionCard
        title="5 · Score & Streak"
        sub="SVG progress ring plus status badges."
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
          }}
        >
          <ScoreRing value={82} />
          <div>
            <div style={{ fontSize: 40 }}>🔥</div>
            <b>7-day streak</b>
            <div>
              <Badge tone="streak">Personal best</Badge>
            </div>
          </div>
          <div>
            <Badge tone="low">Low · Rest</Badge>
            <Badge tone="mid">Mid · Easy day</Badge>
            <Badge tone="high">High · Ready</Badge>
          </div>
        </div>
      </SectionCard>
    </main>
  );
}
