import { Pressable, Text, TextInput, View } from "react-native";
import { colors } from "@vyn/tokens";
import {
  RoutineHeroCard,
  ScoreRing,
  StreakDots,
  StreakPill,
} from "../../components/RNUI";
import { styles } from "../styles";
import { MOODS } from "../constants";
import { AppHeader, NumberRow } from "../components/chrome";
import type {
  DailyTip,
  HistoryItem,
  HomeData,
  PlanItem,
  ShopRec,
} from "../types";

type Props = {
  home: HomeData | null;
  tip: DailyTip | null;
  homeRecs: ShopRec[] | null;
  weekPlan: PlanItem[] | null;
  history: HistoryItem[];
  unread: number;
  soreness: number;
  sleep: string;
  stress: number;
  busy: boolean;
  onMenu: () => void;
  onBell: () => void;
  onCoach: () => void;
  onSoreness: (v: number) => void;
  onSleep: (v: string) => void;
  onStress: (v: number) => void;
  onSubmitCheckIn: () => void;
  onStartSession: (slug: string) => void;
  onOpenProduct: (sku: string) => void;
};

export function HomeScreen({
  home,
  tip,
  homeRecs,
  weekPlan,
  history,
  unread,
  soreness,
  sleep,
  stress,
  busy,
  onMenu,
  onBell,
  onCoach,
  onSoreness,
  onSleep,
  onStress,
  onSubmitCheckIn,
  onStartSession,
  onOpenProduct,
}: Props) {
  return (
    <View>
      <AppHeader
        title={`Good day${home?.score ? ` · ${home.score.score}` : ""}`}
        onMenu={onMenu}
        onBell={onBell}
        unread={unread}
      />
      <Pressable style={styles.secondary} onPress={onCoach}>
        <Text style={styles.secondaryText}>🤖 Ask AI Coach</Text>
      </Pressable>
      <View style={styles.homeTop}>
        <ScoreRing value={home?.score?.score ?? 0} size={120} />
        <View style={{ flex: 1, gap: 8 }}>
          <StreakPill count={home?.streak.count ?? 0} />
          <StreakDots days={7} active={Math.min(7, home?.streak.count ?? 0)} />
          <Text style={styles.cardSub}>
            {home
              ? `${home.weekday} ${home.date}${home.checkIn ? " · checked in" : " · not checked in yet"}`
              : "Loading…"}
          </Text>
        </View>
      </View>

      <Text style={styles.label}>Today&apos;s session</Text>
      {home?.todaySession ? (
        <RoutineHeroCard
          title={home.todaySession.title}
          meta={`${home.todaySession.day} · ${home.todaySession.durationMin} min · ${home.todaySession.slug}`}
          cta="Start session"
          onCta={() => {
            const slug = home.todaySession?.slug;
            if (slug) onStartSession(slug);
          }}
        />
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rest day</Text>
          <Text style={styles.cardSub}>
            No session planned — light movement only.
          </Text>
        </View>
      )}

      <Text style={styles.label}>How does your body feel today?</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m) => (
          <Pressable
            key={m.value}
            style={[styles.mood, soreness === m.value && styles.moodSelected]}
            onPress={() => onSoreness(m.value)}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
            <Text style={styles.moodLabel}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
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
      <Pressable
        style={styles.primary}
        onPress={onSubmitCheckIn}
        disabled={busy}
      >
        <Text style={styles.primaryText}>
          {busy ? "Saving…" : "Submit check-in"}
        </Text>
      </Pressable>

      <Text style={styles.label}>Today&apos;s recovery plan</Text>
      {(weekPlan ?? []).map((item) => {
        const done = history.some((h) => h.programId === item.programId);
        return (
          <View key={item.day} style={styles.checklistRow}>
            <View style={[styles.checkDot, done && styles.checkDone]}>
              {done ? <Text style={styles.checkText}>✓</Text> : null}
            </View>
            <Text style={styles.checklistText}>
              {item.day} · {item.title} ({item.durationMin} min)
            </Text>
          </View>
        );
      })}

      {home?.todaySession ? (
        <Pressable
          style={styles.primary}
          onPress={() => {
            onStartSession(home.todaySession!.slug);
          }}
        >
          <Text style={styles.primaryText}>
            Continue · {home.todaySession.title}
          </Text>
        </Pressable>
      ) : null}

      {tip ? (
        <View style={styles.card}>
          <Text style={styles.cardDay}>Daily tip · {tip.source}</Text>
          <Text style={styles.cardTitle}>{tip.title}</Text>
          <Text style={styles.cardSub}>{tip.body}</Text>
        </View>
      ) : null}

      {homeRecs && homeRecs.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardDay}>
            Today&apos;s routine works even better with
          </Text>
          <Text style={styles.cardTitle}>{homeRecs[0].title}</Text>
          <Pressable
            onPress={() => {
              onOpenProduct(homeRecs[0].sku);
            }}
          >
            <Text style={styles.bookmark}>View product →</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
