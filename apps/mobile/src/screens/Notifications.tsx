import { Pressable, Text, View } from "react-native";
import type { NotificationItem } from "../types";
import { styles } from "../styles";

type Props = {
  items: NotificationItem[];
  onMarkAllRead: () => void;
  onBack: () => void;
};

export function NotificationsScreen({ items, onMarkAllRead, onBack }: Props) {
  const list = items ?? [];
  return (
    <View>
      <Text style={styles.label}>Notifications</Text>
      {list.length === 0 ? (
        <Text style={styles.cardSub}>All caught up.</Text>
      ) : null}
      {list.map((n) => (
        <View key={n.id} style={styles.card}>
          <Text style={styles.cardDay}>
            {n.kind}
            {n.read ? "" : " · new"}
          </Text>
          <Text style={styles.cardTitle}>{n.title}</Text>
          {n.body ? <Text style={styles.cardSub}>{n.body}</Text> : null}
        </View>
      ))}
      {list.some((n) => !n.read) ? (
        <Pressable style={styles.secondary} onPress={onMarkAllRead}>
          <Text style={styles.secondaryText}>Mark all read</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Home</Text>
      </Pressable>
    </View>
  );
}
