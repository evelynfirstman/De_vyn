import { Pressable, Text, TextInput, View } from "react-native";
import { colors } from "@vyn/tokens";
import { styles } from "../styles";
import type { Ticket } from "../types";

type Props = {
  subject: string;
  message: string;
  tickets: Ticket[];
  onSubject: (v: string) => void;
  onMessage: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function SupportScreen({
  subject,
  message,
  tickets,
  onSubject,
  onMessage,
  onSubmit,
  onBack,
}: Props) {
  return (
    <View>
      <Text style={styles.label}>Contact support</Text>
      <TextInput
        style={styles.input}
        value={subject}
        onChangeText={onSubject}
        placeholder="Subject"
        placeholderTextColor={colors.ink[500]}
      />
      <TextInput
        style={[styles.input, { minHeight: 80 }]}
        value={message}
        onChangeText={onMessage}
        placeholder="How can we help?"
        placeholderTextColor={colors.ink[500]}
        multiline
      />
      <Pressable style={styles.primary} onPress={onSubmit}>
        <Text style={styles.primaryText}>Send ticket</Text>
      </Pressable>
      <Text style={styles.label}>My tickets</Text>
      {tickets.map((t) => (
        <View key={t.id} style={styles.card}>
          <Text style={styles.cardDay}>{t.status}</Text>
          <Text style={styles.cardTitle}>{t.subject}</Text>
          {t.message ? <Text style={styles.cardSub}>{t.message}</Text> : null}
        </View>
      ))}
      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Profile</Text>
      </Pressable>
    </View>
  );
}
