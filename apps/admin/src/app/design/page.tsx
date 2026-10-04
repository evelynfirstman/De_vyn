"use client";

import { useState } from "react";
import { colors } from "@vyn/tokens";
import {
  AppHeader,
  Badge,
  BottomNav,
  Button,
  MetricPod,
  OnboardingShell,
  QrScannerModal,
  RegionBar,
  RoutineHeroCard,
  ScoreRing,
  SectionCard,
  SegmentedControl,
  SelectableCard,
  StreakDots,
  TextInput,
  Toast,
} from "@vyn/ui";

const swatches: { name: string; value: string }[] = [
  { name: "Brand 500 · Primary", value: colors.brand[500] },
  { name: "Brand 700 · Hover", value: colors.brand[700] },
  { name: "Brand 900 · Hero", value: colors.brand[900] },
  { name: "Brand 100 · Tint", value: colors.brand[100] },
  { name: "Accent · Streak", value: colors.accent[500] },
  { name: "Surface container", value: colors.surface.container },
  { name: "Surface high", value: colors.surface.high },
  { name: "Secondary container", value: colors.secondary.container },
  { name: "Tertiary fixed", value: colors.tertiary.fixed },
  { name: "Ink 900 · Text", value: colors.ink[900] },
  { name: "Ink 500 · Muted", value: colors.ink[500] },
  { name: "Score · Low (<50)", value: colors.score.low },
  { name: "Score · Mid (50–79)", value: colors.score.mid },
  { name: "Score · High (80–100)", value: colors.score.high },
  { name: "Danger", value: colors.danger },
];

const typeSamples: { label: string; size: number; weight: number }[] = [
  { label: "Display hero mobile", size: 32, weight: 700 },
  { label: "H1", size: 24, weight: 700 },
  { label: "H2", size: 20, weight: 700 },
  { label: "Title md", size: 16, weight: 600 },
  { label: "Body lg", size: 18, weight: 400 },
  { label: "Body", size: 15, weight: 400 },
  { label: "Label caps", size: 11, weight: 700 },
];

export default function DesignSystemPage() {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [goal, setGoal] = useState("");
  const [range, setRange] = useState<"Week" | "Month" | "3M">("Week");
  const [pain, setPain] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const [toast, setToast] = useState(false);

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
          borderRadius: "var(--radius-xl)",
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
          Plus Jakarta Sans · tokens from{" "}
          <code style={{ background: "rgba(255,255,255,.2)" }}>
            @vyn/tokens
          </code>
          , components from{" "}
          <code style={{ background: "rgba(255,255,255,.2)" }}>@vyn/ui</code> ·
          screens in <code>docs/Vyn Therapy UI_UX/</code>
        </p>
      </header>

      <SectionCard
        title="1 · Colors"
        sub="Rendered from tokens.ts — brand, M3 surfaces, score bands."
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
        sub="Plus Jakarta Sans · tight display tracking."
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
        sub="Primary, secondary, outline, kinetic, danger — plus disabled."
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Button>Start session</Button>
          <Button variant="secondary">View plan</Button>
          <Button variant="outline">Browse programs</Button>
          <Button variant="kinetic">Complete session</Button>
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
        sub="Bands: <50 Rest · 50–79 Easy · 80–100 Ready."
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
            <div style={{ marginTop: 8 }}>
              <StreakDots days={7} active={7} />
            </div>
          </div>
          <div>
            <Badge tone="low">Low · Rest</Badge>
            <Badge tone="mid">Mid · Easy day</Badge>
            <Badge tone="high">High · Ready</Badge>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="6 · App patterns (UI_UX)"
        sub="Navigation, segmented, selectable cards, metric pods, region bars, routine hero."
      >
        <div
          style={{
            border: "1px solid var(--ink-100)",
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <AppHeader title="Clinical Knowledge Base" onMenu={() => {}} />
          <div style={{ padding: 16 }}>
            <SegmentedControl
              options={["Week", "Month", "3M"] as const}
              value={range}
              onChange={setRange}
              ariaLabel="Timeframe"
            />
            <div style={{ height: 12 }} />
            <SelectableCard
              selected={pain}
              onToggle={() => setPain(!pain)}
              title="Tech neck & upper back"
              description="Cervical traction pillow + heat collar"
              badge="High strain"
              icon={<span>🦒</span>}
            />
            <div style={{ height: 12 }} />
            <div style={{ display: "flex", gap: 12 }}>
              <MetricPod label="Sessions" value="12" tone="high" />
              <MetricPod label="Minutes" value="96" unit="min" tone="mid" />
              <MetricPod label="Strain" value="34" unit="%" tone="low" />
            </div>
            <div style={{ height: 16 }} />
            <RegionBar
              label="Neck"
              percent={82}
              caption="7° tilt improvement"
            />
            <RegionBar label="Lower back" percent={68} />
            <div style={{ height: 8 }} />
            <RoutineHeroCard
              title="Cervical reset · 12 min"
              meta="3 sessions · countdown + posture silhouette"
              cta="Resume program"
            />
          </div>
          <BottomNav active="Home" />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={() => setQrOpen(true)}>
            Open QR scanner modal
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setToast(true);
              setTimeout(() => setToast(false), 2000);
            }}
          >
            Show toast (+5 XP)
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="7 · Onboarding shell"
        sub="390px frame · step bar · sticky CTA · HIPAA note — as used in Steps 1–4."
      >
        <OnboardingShell
          step={2}
          total={4}
          title="Where do you feel strain?"
          subtitle="Symptom mapping — pick all that apply."
          cta="Continue"
        >
          <SelectableCard
            selected
            onToggle={() => {}}
            title="Neck / Tech neck"
            description="Cervical spine · stiffness after long desk sessions"
          />
        </OnboardingShell>
      </SectionCard>

      <QrScannerModal open={qrOpen} onClose={() => setQrOpen(false)} />
      {toast ? <Toast message="+5 XP · Session logged" /> : null}
    </main>
  );
}
