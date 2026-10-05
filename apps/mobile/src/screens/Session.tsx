import { Pressable, Text, TextInput, View } from "react-native";
import { colors } from "@vyn/tokens";
import { styles } from "../styles";
import type { HomeData, Program } from "../types";

type ProgramProps = {
  program: Program;
  stepIdx: number;
  secondsLeft: number;
  timerOn: boolean;
  finished: boolean;
  busy: boolean;
  doneMsg: string | null;
  saved: boolean;
  onToggleSave: () => void;
  onToggleTimer: () => void;
  onSkipStep: () => void;
  onFinish: () => void;
  onAllPrograms: () => void;
};

export function ProgramScreen({
  program,
  stepIdx,
  secondsLeft,
  timerOn,
  finished,
  busy,
  doneMsg,
  saved,
  onToggleSave,
  onToggleTimer,
  onSkipStep,
  onFinish,
  onAllPrograms,
}: ProgramProps) {
  return (
    <View>
      <Text style={styles.label}>{program.title}</Text>
      <Pressable onPress={onToggleSave}>
        <Text style={styles.bookmark}>
          {saved ? "★ Saved" : "☆ Save program"}
        </Text>
      </Pressable>
      <Text style={styles.cardSub}>{program.description}</Text>
      {program.steps.map((s, i) => (
        <View
          key={s.name}
          style={[styles.card, i === stepIdx && styles.cardActive]}
        >
          <Text style={styles.cardDay}>
            Step {i + 1} of {program.steps.length}
          </Text>
          <Text style={styles.cardTitle}>{s.name}</Text>
          <Text style={styles.cardSub}>
            {i === stepIdx ? `${secondsLeft}s left` : `${s.seconds}s`}
          </Text>
        </View>
      ))}
      {doneMsg ? <Text style={styles.doneMsg}>{doneMsg}</Text> : null}
      <View style={styles.btnRow}>
        <Pressable style={styles.primary} onPress={onToggleTimer}>
          <Text style={styles.primaryText}>
            {timerOn ? "Pause" : "Start / Resume"}
          </Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={onSkipStep}>
          <Text style={styles.secondaryText}>Skip step</Text>
        </Pressable>
      </View>
      <Text style={styles.cardSub}>
        Equipment:{" "}
        {program.equipment.length > 0
          ? program.equipment.join(", ")
          : "Bodyweight only"}
      </Text>
      <Text style={styles.cardSub}>
        Safety: move gently, never push into sharp pain. Stop and rest if you
        feel dizzy or numb.
      </Text>
      <Pressable
        style={[styles.primary, !finished && { opacity: 0.45 }]}
        disabled={!finished || busy}
        onPress={onFinish}
      >
        <Text style={styles.primaryText}>Finish</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onAllPrograms}>
        <Text style={styles.secondaryText}>All programs</Text>
      </Pressable>
    </View>
  );
}

type FeedbackProps = {
  rating: number;
  feedback: string;
  busy: boolean;
  onRating: (v: number) => void;
  onFeedback: (v: string) => void;
  onSubmit: () => void;
};

export function FeedbackScreen({
  rating,
  feedback,
  busy,
  onRating,
  onFeedback,
  onSubmit,
}: FeedbackProps) {
  return (
    <View>
      <Text style={styles.label}>How did that feel?</Text>
      <View style={styles.moodRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Pressable
            key={s}
            style={[styles.mood, rating === s && styles.moodSelected]}
            onPress={() => onRating(s)}
          >
            <Text style={styles.moodEmoji}>{"★".repeat(1)}</Text>
            <Text style={styles.moodLabel}>{s}/5</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={[styles.input, { minHeight: 80 }]}
        value={feedback}
        onChangeText={onFeedback}
        placeholder="Anything to note? (optional)"
        placeholderTextColor={colors.ink[500]}
        multiline
      />
      <Pressable style={styles.primary} onPress={onSubmit} disabled={busy}>
        <Text style={styles.primaryText}>
          {busy ? "Saving…" : "Submit feedback"}
        </Text>
      </Pressable>
    </View>
  );
}

type DoneProps = {
  doneMsg: string | null;
  lastGain: number | null;
  home: HomeData | null;
  onHome: () => void;
  onProgress: () => void;
};

export function DoneScreen({
  doneMsg,
  lastGain,
  home,
  onHome,
  onProgress,
}: DoneProps) {
  return (
    <View style={styles.centerWrap}>
      <Text style={styles.splashLogo}>🎉</Text>
      <Text style={styles.label}>Great job!</Text>
      <Text style={styles.cardSub}>Today&apos;s recovery is complete.</Text>
      {doneMsg ? <Text style={styles.doneMsg}>{doneMsg}</Text> : null}
      {lastGain !== null ? (
        <Text style={styles.streakFlame}>
          Recovery Score {lastGain >= 0 ? `+${lastGain}` : lastGain}
        </Text>
      ) : null}
      {home ? (
        <Text style={styles.cardSub}>🔥 {home.streak.count}-day streak</Text>
      ) : null}
      <Pressable style={styles.primary} onPress={onHome}>
        <Text style={styles.primaryText}>Back to Home</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onProgress}>
        <Text style={styles.secondaryText}>Track progress</Text>
      </Pressable>
    </View>
  );
}
