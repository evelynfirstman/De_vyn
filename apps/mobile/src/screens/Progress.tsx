import { Pressable, Text, View } from "react-native";
import { scoreBandFor } from "@vyn/tokens";
import { bandColor } from "../../theme";
import { styles } from "../styles";
import type { GameState, ProgressData, Rec } from "../types";

type Props = {
  progress: ProgressData | null;
  game: GameState | null;
  recs: Rec[] | null;
  onLoadGame: () => void;
  onOpenRec: (r: Rec) => void;
  onBack: () => void;
};

export function ProgressScreen({
  progress,
  game,
  recs,
  onLoadGame,
  onOpenRec,
  onBack,
}: Props) {
  return (
    <View>
      <Text style={styles.label}>Score history</Text>
      {(progress?.scores ?? []).slice(-14).map((s) => (
        <View key={s.date} style={styles.barRow}>
          <Text style={styles.barLabel}>{s.date.slice(5)}</Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${s.score}%`,
                  backgroundColor: bandColor(scoreBandFor(s.score)),
                },
              ]}
            />
          </View>
          <Text style={styles.barValue}>{s.score}</Text>
        </View>
      ))}
      {progress && progress.scores.length === 0 ? (
        <Text style={styles.cardSub}>No scores yet — submit a check-in.</Text>
      ) : null}

      <Text style={styles.label}>Milestones</Text>
      {(progress?.milestones ?? []).map((m) => (
        <View key={m.kind} style={styles.card}>
          <Text style={styles.cardTitle}>🏆 {m.label}</Text>
          <Text style={styles.cardSub}>
            {new Date(m.achievedAt).toLocaleDateString()}
          </Text>
        </View>
      ))}
      {progress && progress.milestones.length === 0 ? (
        <Text style={styles.cardSub}>No milestones yet — keep going.</Text>
      ) : null}

      <Text style={styles.label}>Level & XP</Text>
      {game ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Level {game.level} · {game.xp} XP ({game.xpToNext} to next)
          </Text>
          <Text style={styles.cardSub}>
            {game.badges
              .filter((b) => b.earned)
              .map((b) => `🏅 ${b.title}`)
              .join(" · ") || "No badges yet"}
          </Text>
        </View>
      ) : (
        <Pressable style={styles.secondary} onPress={onLoadGame}>
          <Text style={styles.secondaryText}>Load gamification</Text>
        </Pressable>
      )}
      <Text style={styles.label}>Challenges</Text>
      {(game?.challenges ?? []).map((c) => (
        <View key={c.id} style={styles.card}>
          <Text style={styles.cardTitle}>
            {c.done ? "✓ " : ""}
            {c.title}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.round((c.progress / c.target) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.cardSub}>
            {c.progress}/{c.target}
          </Text>
        </View>
      ))}

      <Text style={styles.label}>Recommended for you</Text>
      {(recs ?? []).map((r) => (
        <Pressable
          key={`${r.kind}-${r.title}`}
          style={styles.card}
          onPress={() => onOpenRec(r)}
        >
          <Text style={styles.cardDay}>{r.kind}</Text>
          <Text style={styles.cardTitle}>{r.title}</Text>
          <Text style={styles.cardSub}>{r.reason}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Home</Text>
      </Pressable>
    </View>
  );
}
