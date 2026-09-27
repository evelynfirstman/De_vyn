import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "@vyn/tokens";

// Demo actor until Better Auth lands (Phase 2b).
const DEMO_USER_ID = 1;
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

type Screen = "profile" | "assessment" | "plan" | "home";

type PlanItem = {
  day: string;
  programId: number;
  slug: string;
  title: string;
  durationMin: number;
};

type Plan = {
  id: number;
  items: PlanItem[];
  rationale: string;
};

type HomeData = {
  date: string;
  weekday: string;
  todaySession: {
    day: string;
    title: string;
    durationMin: number;
    slug: string;
  } | null;
  score: { score: number; band: string } | null;
  streak: { count: number; lastDate: string | null };
  checkIn: { soreness: number; sleepHours: string; stress: number } | null;
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const GOAL_OPTIONS = [
  "Neck relief",
  "Back relief",
  "Better posture",
  "Move daily",
];
const PAIN_OPTIONS = ["neck", "lower-back", "shoulders", "posture"];

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    data?: unknown;
    error?: { message: string };
  };
  if (!res.ok)
    throw new Error(json.error?.message ?? `Request failed (${res.status})`);
  return json.data;
}

async function getJson(path: string) {
  const res = await fetch(`${API_URL}${path}`);
  const json = (await res.json()) as {
    data?: unknown;
    error?: { message: string };
  };
  if (!res.ok)
    throw new Error(json.error?.message ?? `Request failed (${res.status})`);
  return json.data;
}

async function putJson(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    data?: unknown;
    error?: { message: string };
  };
  if (!res.ok)
    throw new Error(json.error?.message ?? `Request failed (${res.status})`);
  return json.data;
}

function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function NumberRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(Math.max(min, value - 1))}
        >
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(Math.min(max, value + 1))}
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("profile");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [goals, setGoals] = useState<string[]>([]);
  const [painAreas, setPainAreas] = useState<string[]>(["neck"]);
  const [minutes, setMinutes] = useState(15);
  const [days, setDays] = useState(3);

  const [soreness, setSoreness] = useState(3);
  const [sleep, setSleep] = useState("7");
  const [stress, setStress] = useState(3);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [home, setHome] = useState<HomeData | null>(null);

  const toggle = (list: string[], v: string, set: (l: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function saveProfile() {
    setBusy(true);
    setError(null);
    try {
      await putJson("/v1/profiles", {
        userId: DEMO_USER_ID,
        goals,
        painAreas,
        equipment: [],
        minutesPerSession: minutes,
        daysPerWeek: days,
      });
      setScreen("assessment");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveAssessment() {
    setBusy(true);
    setError(null);
    try {
      await postJson("/v1/assessments", {
        userId: DEMO_USER_ID,
        soreness,
        sleepHours: Number(sleep) || 0,
        stress,
        activity: "",
        painAreas,
      });
      const generated = (await postJson("/v1/plans/generate", {
        userId: DEMO_USER_ID,
      })) as Plan;
      setPlan(generated);
      setScreen("plan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function openHome() {
    setBusy(true);
    setError(null);
    try {
      const data = (await getJson(
        `/v1/home?userId=${DEMO_USER_ID}&date=${todayStr()}`,
      )) as HomeData;
      setHome(data);
      setScreen("home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (screen === "home" && home === null && !busy) {
      openHome();
    }
  }, [screen]);

  async function submitCheckIn() {
    setBusy(true);
    setError(null);
    try {
      await postJson("/v1/check-ins", {
        userId: DEMO_USER_ID,
        date: todayStr(),
        soreness,
        sleepHours: Number(sleep) || 0,
        stress,
        activity: "",
        timezone: "UTC",
      });
      const data = (await getJson(
        `/v1/home?userId=${DEMO_USER_ID}&date=${todayStr()}`,
      )) as HomeData;
      setHome(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>Vyn Therapy</Text>
      <Text style={styles.step}>
        {screen === "profile"
          ? "Step 1 of 3 · Profile"
          : screen === "assessment"
            ? "Step 2 of 3 · Assessment"
            : screen === "plan"
              ? "Step 3 of 3 · Your plan"
              : "Home · Daily check-in"}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {screen === "profile" && (
        <View>
          <Text style={styles.label}>Goals</Text>
          <View style={styles.chips}>
            {GOAL_OPTIONS.map((g) => (
              <Chip
                key={g}
                label={g}
                selected={goals.includes(g)}
                onToggle={() => toggle(goals, g, setGoals)}
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
                onToggle={() => toggle(painAreas, p, setPainAreas)}
              />
            ))}
          </View>
          <NumberRow
            label="Minutes per session"
            value={minutes}
            min={5}
            max={120}
            onChange={setMinutes}
          />
          <NumberRow
            label="Days per week"
            value={days}
            min={1}
            max={7}
            onChange={setDays}
          />
          <Pressable
            style={styles.primary}
            onPress={saveProfile}
            disabled={busy}
          >
            <Text style={styles.primaryText}>
              {busy ? "Saving…" : "Continue"}
            </Text>
          </Pressable>
        </View>
      )}

      {screen === "assessment" && (
        <View>
          <NumberRow
            label="Soreness (1–5)"
            value={soreness}
            min={1}
            max={5}
            onChange={setSoreness}
          />
          <Text style={styles.label}>Sleep hours</Text>
          <TextInput
            style={styles.input}
            value={sleep}
            onChangeText={setSleep}
            keyboardType="numeric"
            placeholder="e.g. 7"
            placeholderTextColor={colors.ink[500]}
          />
          <NumberRow
            label="Stress (1–5)"
            value={stress}
            min={1}
            max={5}
            onChange={setStress}
          />
          <Pressable
            style={styles.primary}
            onPress={saveAssessment}
            disabled={busy}
          >
            <Text style={styles.primaryText}>
              {busy ? "Building plan…" : "Generate my plan"}
            </Text>
          </Pressable>
        </View>
      )}

      {screen === "plan" && plan && (
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
          <Pressable style={styles.primary} onPress={openHome} disabled={busy}>
            <Text style={styles.primaryText}>
              {busy ? "Loading…" : "Open Home"}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondary}
            onPress={() => setScreen("profile")}
          >
            <Text style={styles.secondaryText}>Start over</Text>
          </Pressable>
        </View>
      )}

      {screen === "home" && (
        <View>
          <View style={styles.homeTop}>
            <View
              style={[
                styles.scoreCircle,
                {
                  borderColor:
                    home?.score?.band === "high"
                      ? colors.score.high
                      : home?.score?.band === "mid"
                        ? colors.score.mid
                        : colors.score.low,
                },
              ]}
            >
              <Text style={styles.scoreNum}>{home?.score?.score ?? "–"}</Text>
            </View>
            <View>
              <Text style={styles.streakFlame}>
                🔥 {home?.streak.count ?? 0}-day streak
              </Text>
              <Text style={styles.cardSub}>
                {home
                  ? `${home.weekday} ${home.date}${home.checkIn ? " · checked in" : " · not checked in yet"}`
                  : "Loading…"}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Today&apos;s session</Text>
          {home?.todaySession ? (
            <View style={styles.card}>
              <Text style={styles.cardDay}>{home.todaySession.day}</Text>
              <Text style={styles.cardTitle}>{home.todaySession.title}</Text>
              <Text style={styles.cardSub}>
                {home.todaySession.durationMin} min · {home.todaySession.slug}
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Rest day</Text>
              <Text style={styles.cardSub}>
                No session planned — light movement only.
              </Text>
            </View>
          )}

          <Text style={styles.label}>Daily check-in</Text>
          <NumberRow
            label="Soreness (1–5)"
            value={soreness}
            min={1}
            max={5}
            onChange={setSoreness}
          />
          <Text style={styles.label}>Sleep hours</Text>
          <TextInput
            style={styles.input}
            value={sleep}
            onChangeText={setSleep}
            keyboardType="numeric"
            placeholder="e.g. 7"
            placeholderTextColor={colors.ink[500]}
          />
          <NumberRow
            label="Stress (1–5)"
            value={stress}
            min={1}
            max={5}
            onChange={setStress}
          />
          <Pressable
            style={styles.primary}
            onPress={submitCheckIn}
            disabled={busy}
          >
            <Text style={styles.primaryText}>
              {busy ? "Saving…" : "Submit check-in"}
            </Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => setScreen("plan")}>
            <Text style={styles.secondaryText}>View my plan</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 24, backgroundColor: colors.ink[50], flexGrow: 1 },
  title: { fontSize: 28, fontWeight: "800", color: colors.brand[900] },
  step: { fontSize: 14, color: colors.ink[500], marginBottom: 16 },
  error: { color: colors.danger, marginBottom: 12 },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 6,
    color: colors.ink[900],
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.ink[300],
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  chipText: { color: colors.ink[700], fontWeight: "600" },
  chipTextSelected: { color: "#fff" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand[100],
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { fontSize: 20, color: colors.brand[900], fontWeight: "700" },
  stepValue: {
    fontSize: 18,
    fontWeight: "700",
    minWidth: 32,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: colors.ink[300],
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  primary: {
    backgroundColor: colors.brand[500],
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondary: {
    backgroundColor: colors.brand[100],
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  secondaryText: { color: colors.brand[900], fontWeight: "700", fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.ink[100],
  },
  cardDay: { fontSize: 13, fontWeight: "700", color: colors.brand[700] },
  cardTitle: { fontSize: 17, fontWeight: "700", marginTop: 2 },
  cardSub: { fontSize: 14, color: colors.ink[500], marginTop: 2 },
  rationale: { fontSize: 13, color: colors.ink[500], marginTop: 12 },
  homeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  scoreCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  scoreNum: { fontSize: 26, fontWeight: "800", color: colors.ink[900] },
  streakFlame: { fontSize: 18, fontWeight: "700" },
});
