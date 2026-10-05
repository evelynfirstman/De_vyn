import { Pressable, Text, TextInput, View } from "react-native";
import { colors } from "@vyn/tokens";
import { Logo, OnboardingProgress } from "../../components/RNUI";
import { styles } from "../styles";
import { ACTIVITY_LEVELS, GOAL_OPTIONS, PAIN_OPTIONS } from "../constants";
import { Chip } from "../components/chrome";
import { NumberRow } from "../components/chrome";
import type { Explanation, Plan } from "../types";

export function SplashScreen() {
  return (
    <View style={styles.splashWrap}>
      <Logo size={112} />
      <Text style={styles.splashTitle}>Vyn Therapy</Text>
      <Text style={styles.splashTag}>Your daily recovery companion</Text>
      <View style={styles.splashLoader}>
        <View style={styles.splashLoaderFill} />
      </View>
    </View>
  );
}

type WelcomeProps = {
  mode: "in" | "up";
  name: string;
  email: string;
  password: string;
  busy: boolean;
  onMode: (m: "in" | "up") => void;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onSubmit: () => void;
};

export function WelcomeScreen({
  mode,
  name,
  email,
  password,
  busy,
  onMode,
  onName,
  onEmail,
  onPassword,
  onSubmit,
}: WelcomeProps) {
  return (
    <View>
      <Text style={styles.label}>Recover smarter, every day</Text>
      <Text style={styles.cardSub}>
        Personalized plans, guided sessions and curated products for desk-based
        bodies — in 5 to 15 minutes a day.
      </Text>
      <View style={styles.chips}>
        <Chip
          label="Create account"
          selected={mode === "up"}
          onToggle={() => onMode("up")}
        />
        <Chip
          label="Sign in"
          selected={mode === "in"}
          onToggle={() => onMode("in")}
        />
      </View>
      {mode === "up" ? (
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={onName}
          placeholder="Name"
          placeholderTextColor={colors.ink[500]}
        />
      ) : null}
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={onEmail}
        placeholder="Email"
        placeholderTextColor={colors.ink[500]}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={onPassword}
        placeholder="Password (8+ characters)"
        placeholderTextColor={colors.ink[500]}
        secureTextEntry
      />
      <Pressable style={styles.primary} onPress={onSubmit} disabled={busy}>
        <Text style={styles.primaryText}>
          {busy ? "Please wait…" : mode === "up" ? "Create account" : "Sign in"}
        </Text>
      </Pressable>
    </View>
  );
}

type AboutProps = {
  occupation: string;
  activityLevel: string;
  onOccupation: (v: string) => void;
  onActivityLevel: (v: string) => void;
  onContinue: () => void;
};

export function AboutScreen({
  occupation,
  activityLevel,
  onOccupation,
  onActivityLevel,
  onContinue,
}: AboutProps) {
  return (
    <View>
      <OnboardingProgress step={1} total={4} />
      <Text style={styles.label}>Professional context</Text>
      <TextInput
        style={styles.input}
        value={occupation}
        onChangeText={onOccupation}
        placeholder="e.g. Software developer"
        placeholderTextColor={colors.ink[500]}
      />
      <Text style={styles.label}>Activity level</Text>
      <View style={styles.chips}>
        {ACTIVITY_LEVELS.map((a) => (
          <Chip
            key={a}
            label={a}
            selected={activityLevel === a}
            onToggle={() => onActivityLevel(a)}
          />
        ))}
      </View>
      <Pressable style={styles.primary} onPress={onContinue}>
        <Text style={styles.primaryText}>Continue</Text>
      </Pressable>
    </View>
  );
}

type OwnedProps = {
  options: string[];
  owned: string[];
  onToggle: (sku: string) => void;
  onContinue: () => void;
};

export function OwnedScreen({
  options,
  owned,
  onToggle,
  onContinue,
}: OwnedProps) {
  return (
    <View>
      <OnboardingProgress step={3} total={4} />
      <Text style={styles.label}>Hardware pairing</Text>
      <Text style={styles.cardSub}>
        Scan your Vyn gear QR to unlock guides &amp; paired protocols — or pick
        what you own below.
      </Text>
      <Text style={styles.cardSub}>We will tailor routines to your gear.</Text>
      <View style={styles.chips}>
        {options.map((sku) => (
          <Chip
            key={sku}
            label={sku}
            selected={owned.includes(sku)}
            onToggle={() => onToggle(sku)}
          />
        ))}
      </View>
      <Pressable style={styles.primary} onPress={onContinue}>
        <Text style={styles.primaryText}>Generate recovery profile</Text>
      </Pressable>
    </View>
  );
}

type ProfileProps = {
  goals: string[];
  painAreas: string[];
  minutes: number;
  days: number;
  busy: boolean;
  onToggleGoal: (g: string) => void;
  onTogglePain: (p: string) => void;
  onMinutes: (v: number) => void;
  onDays: (v: number) => void;
  onContinue: () => void;
};

export function ProfileScreen({
  goals,
  painAreas,
  minutes,
  days,
  busy,
  onToggleGoal,
  onTogglePain,
  onMinutes,
  onDays,
  onContinue,
}: ProfileProps) {
  return (
    <View>
      <OnboardingProgress step={2} total={4} />
      <Text style={styles.label}>Symptom mapping</Text>
      <Text style={styles.cardSub}>
        Where do you feel strain? Pick all that apply.
      </Text>
      <Text style={styles.label}>Goals</Text>
      <View style={styles.chips}>
        {GOAL_OPTIONS.map((g) => (
          <Chip
            key={g}
            label={g}
            selected={goals.includes(g)}
            onToggle={() => onToggleGoal(g)}
          />
        ))}
      </View>
      <Text style={styles.label}>Pain areas</Text>
      <View style={styles.chips}>
        {PAIN_OPTIONS.map((p) => (
          <Chip
            key={p}
            label={p}
            selected={painAreas.includes(p)}
            onToggle={() => onTogglePain(p)}
          />
        ))}
      </View>
      <NumberRow
        label="Minutes per session"
        value={minutes}
        min={5}
        max={120}
        onChange={onMinutes}
      />
      <NumberRow
        label="Days per week"
        value={days}
        min={1}
        max={7}
        onChange={onDays}
      />
      <Pressable style={styles.primary} onPress={onContinue} disabled={busy}>
        <Text style={styles.primaryText}>{busy ? "Saving…" : "Continue"}</Text>
      </Pressable>
    </View>
  );
}

type AssessmentProps = {
  soreness: number;
  sleep: string;
  stress: number;
  busy: boolean;
  onSoreness: (v: number) => void;
  onSleep: (v: string) => void;
  onStress: (v: number) => void;
  onSubmit: () => void;
};

export function AssessmentScreen({
  soreness,
  sleep,
  stress,
  busy,
  onSoreness,
  onSleep,
  onStress,
  onSubmit,
}: AssessmentProps) {
  return (
    <View>
      <NumberRow
        label="Soreness (1–5)"
        value={soreness}
        min={1}
        max={5}
        onChange={onSoreness}
      />
      <Text style={styles.label}>Sleep hours</Text>
      <TextInput
        style={styles.input}
        value={sleep}
        onChangeText={onSleep}
        keyboardType="numeric"
        placeholder="e.g. 7"
        placeholderTextColor={colors.ink[500]}
      />
      <NumberRow
        label="Stress (1–5)"
        value={stress}
        min={1}
        max={5}
        onChange={onStress}
      />
      <Pressable style={styles.primary} onPress={onSubmit} disabled={busy}>
        <Text style={styles.primaryText}>
          {busy ? "Building plan…" : "Generate my plan"}
        </Text>
      </Pressable>
    </View>
  );
}

type PlanProps = {
  plan: Plan;
  explanation: Explanation | null;
  busy: boolean;
  onExplain: () => void;
  onOpenHome: () => void;
  onStartOver: () => void;
};

export function PlanScreen({
  plan,
  explanation,
  busy,
  onExplain,
  onOpenHome,
  onStartOver,
}: PlanProps) {
  return (
    <View>
      {plan.items.map((item) => (
        <View key={item.day} style={styles.card}>
          <Text style={styles.cardDay}>{item.day}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSub}>
            {item.durationMin} min · {item.slug}
          </Text>
        </View>
      ))}
      <Text style={styles.rationale}>{plan.rationale}</Text>
      {explanation ? (
        <View style={styles.card}>
          <Text style={styles.cardDay}>Why this plan</Text>
          <Text style={styles.cardSub}>{explanation.summary}</Text>
          {explanation.reasons.map((r) => (
            <Text key={r} style={styles.cardSub}>
              • {r}
            </Text>
          ))}
          {explanation.sources.map((s) => (
            <Text key={s.title} style={styles.cardSub}>
              📖 {s.title} ({s.source})
            </Text>
          ))}
          <Text style={styles.cardSub}>{explanation.disclaimer}</Text>
        </View>
      ) : (
        <Pressable style={styles.secondary} onPress={onExplain}>
          <Text style={styles.secondaryText}>Why this plan?</Text>
        </Pressable>
      )}
      <Pressable style={styles.primary} onPress={onOpenHome} disabled={busy}>
        <Text style={styles.primaryText}>
          {busy ? "Loading…" : "Open Home"}
        </Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onStartOver}>
        <Text style={styles.secondaryText}>Start over</Text>
      </Pressable>
    </View>
  );
}
