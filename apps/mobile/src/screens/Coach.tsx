import { Pressable, Text, TextInput, View } from "react-native";
import { colors } from "@vyn/tokens";
import { styles } from "../styles";
import type { ChatMsg } from "../types";

type Props = {
  chat: ChatMsg[];
  input: string;
  busy: boolean;
  onInput: (v: string) => void;
  onSend: () => void;
  onBack: () => void;
};

export function CoachScreen({
  chat,
  input,
  busy,
  onInput,
  onSend,
  onBack,
}: Props) {
  return (
    <View>
      <Text style={styles.cardSub}>
        Grounded in your plan, scores and the Vyn knowledge base.
      </Text>
      {chat.length === 0 ? (
        <Text style={styles.cardSub}>Try: “What should I focus on today?”</Text>
      ) : null}
      {chat.map((m, i) => (
        <View
          key={i}
          style={[
            styles.card,
            m.role === "user" && { backgroundColor: "#eef4ff" },
          ]}
        >
          <Text style={styles.cardDay}>
            {m.role === "user" ? "You" : "Vyn Coach"}
          </Text>
          <Text style={styles.cardSub}>{m.content}</Text>
          {(m.sources ?? []).map((s) => (
            <Text key={s.title} style={styles.cardSub}>
              📖 {s.title} ({s.source})
            </Text>
          ))}
        </View>
      ))}
      <TextInput
        style={[styles.input, { minHeight: 48 }]}
        value={input}
        onChangeText={onInput}
        placeholder="Ask about recovery…"
        placeholderTextColor={colors.ink[500]}
        multiline
      />
      <Pressable style={styles.primary} onPress={onSend} disabled={busy}>
        <Text style={styles.primaryText}>{busy ? "Thinking…" : "Send"}</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Home</Text>
      </Pressable>
    </View>
  );
}
