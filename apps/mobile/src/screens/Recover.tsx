import { Pressable, Text, View } from "react-native";
import { styles } from "../styles";
import { RECOVER_TAGS } from "../constants";
import { Chip } from "../components/chrome";
import type { Program } from "../types";

type Props = {
  programs: Program[] | null;
  activeTag: string | null;
  pendingCount: number;
  loading: boolean;
  onSelectTag: (tag: string | null) => void;
  onOpenProgram: (slug: string) => void;
  onBack: () => void;
};

export function RecoverScreen({
  programs,
  activeTag,
  pendingCount,
  loading,
  onSelectTag,
  onOpenProgram,
  onBack,
}: Props) {
  const list = (programs ?? []).filter(
    (p) => !activeTag || p.problemTags.includes(activeTag),
  );
  return (
    <View>
      {pendingCount > 0 ? (
        <Text style={styles.pendingBanner}>
          {pendingCount} session(s) saved offline — will sync
        </Text>
      ) : null}
      {loading && programs === null ? (
        <Text style={styles.cardSub}>Loading…</Text>
      ) : null}
      <Text style={styles.label}>Recovery library</Text>
      <View style={styles.chips}>
        <Chip
          label="All"
          selected={activeTag === null}
          onToggle={() => onSelectTag(null)}
        />
        {RECOVER_TAGS.map((t) => (
          <Chip
            key={t}
            label={t}
            selected={activeTag === t}
            onToggle={() => onSelectTag(t)}
          />
        ))}
      </View>
      {list.map((p) => (
        <Pressable
          key={p.slug}
          style={styles.card}
          onPress={() => {
            onOpenProgram(p.slug);
          }}
        >
          <Text style={styles.cardDay}>
            {p.level} · {p.duration_min} min
          </Text>
          <Text style={styles.cardTitle}>{p.title}</Text>
          <Text style={styles.cardSub}>{p.description}</Text>
        </Pressable>
      ))}
      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Home</Text>
      </Pressable>
    </View>
  );
}
