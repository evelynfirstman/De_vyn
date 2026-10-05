import { Pressable, Text, TextInput, View } from "react-native";
import { colors } from "@vyn/tokens";
import { styles } from "../styles";
import type {
  Entitlement,
  Goal,
  NotificationItem,
  ReferralInfo,
  ShopOrder,
  SubPlan,
} from "../types";

type Props = {
  occupation: string;
  productsOwned: string[];
  notifications: NotificationItem[] | null;
  goalList: Goal[] | null;
  newGoal: string;
  shopOrders: ShopOrder[] | null;
  entitlement: Entitlement | null;
  subPlans: SubPlan[] | null;
  referral: ReferralInfo | null;
  redeemInput: string;
  redeemMsg: string | null;
  promos: boolean;
  reminders: boolean;
  reminderTime: string;
  confirmDelete: boolean;
  onMarkAllRead: () => void;
  onToggleGoal: (g: Goal) => void;
  onRemoveGoal: (id: number) => void;
  onNewGoal: (v: string) => void;
  onAddGoal: () => void;
  onLoadPlans: () => void;
  onSubscribe: (planId: number) => void;
  onEnsureReferral: () => void;
  onRedeemInput: (v: string) => void;
  onRedeem: () => void;
  onTogglePromos: () => void;
  onToggleReminders: () => void;
  onReminderTime: (v: string) => void;
  onSaveReminderTime: () => void;
  onDeleteData: () => void;
  onBack: () => void;
};

export function AccountScreen({
  occupation,
  productsOwned,
  notifications,
  goalList,
  newGoal,
  shopOrders,
  entitlement,
  subPlans,
  referral,
  redeemInput,
  redeemMsg,
  promos,
  reminders,
  reminderTime,
  confirmDelete,
  onMarkAllRead,
  onToggleGoal,
  onRemoveGoal,
  onNewGoal,
  onAddGoal,
  onLoadPlans,
  onSubscribe,
  onEnsureReferral,
  onRedeemInput,
  onRedeem,
  onTogglePromos,
  onToggleReminders,
  onReminderTime,
  onSaveReminderTime,
  onDeleteData,
  onBack,
}: Props) {
  return (
    <View>
      <Text style={styles.label}>About you</Text>
      <View style={styles.card}>
        <Text style={styles.cardSub}>
          {occupation || "Occupation not set"} · Gear:{" "}
          {productsOwned.length > 0 ? productsOwned.join(", ") : "none listed"}
        </Text>
      </View>
      <Text style={styles.label}>Notifications</Text>
      {(notifications ?? []).slice(0, 5).map((n) => (
        <View key={n.id} style={styles.card}>
          <Text style={styles.cardTitle}>{n.title}</Text>
          <Text style={styles.cardSub}>{n.body}</Text>
        </View>
      ))}
      {(notifications ?? []).some((n) => !n.read) ? (
        <Pressable style={styles.secondary} onPress={onMarkAllRead}>
          <Text style={styles.secondaryText}>Mark all read</Text>
        </Pressable>
      ) : null}

      <Text style={styles.label}>Goals</Text>
      {(goalList ?? []).map((g) => (
        <View key={g.id} style={styles.goalRow}>
          <Pressable
            style={[styles.checkbox, g.done && styles.checkboxDone]}
            onPress={() => onToggleGoal(g)}
          >
            <Text style={styles.checkboxText}>{g.done ? "✓" : ""}</Text>
          </Pressable>
          <Text style={[styles.goalTitle, g.done && styles.goalDone]}>
            {g.title}
          </Text>
          <Pressable onPress={() => onRemoveGoal(g.id)}>
            <Text style={styles.goalDelete}>✕</Text>
          </Pressable>
        </View>
      ))}
      <TextInput
        style={styles.input}
        value={newGoal}
        onChangeText={onNewGoal}
        placeholder="New goal, e.g. Stretch twice a week"
        placeholderTextColor={colors.ink[500]}
      />
      <Pressable style={styles.primary} onPress={onAddGoal}>
        <Text style={styles.primaryText}>Add goal</Text>
      </Pressable>

      <Text style={styles.label}>My orders</Text>
      {(shopOrders ?? []).map((o) => (
        <View key={o.id} style={styles.card}>
          <Text style={styles.cardDay}>
            #{o.id} · {o.status}
          </Text>
          <Text style={styles.cardSub}>
            {o.items.map((i) => `${i.title} ×${i.qty}`).join(" · ")}
          </Text>
        </View>
      ))}

      <Text style={styles.label}>Premium</Text>
      {entitlement?.premium ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            ★ Premium · {entitlement.subscription?.planName}
          </Text>
        </View>
      ) : (
        <View>
          {(subPlans ?? []).map((p) => (
            <View key={p.id} style={styles.card}>
              <Text style={styles.cardTitle}>{p.name}</Text>
              <Text style={styles.cardSub}>
                {p.currency === "NGN" ? "₦" : `${p.currency} `}
                {(p.amountMinor / 100).toLocaleString()}/{p.interval}
              </Text>
              <Pressable
                style={styles.primary}
                onPress={() => onSubscribe(p.id)}
              >
                <Text style={styles.primaryText}>Subscribe</Text>
              </Pressable>
            </View>
          ))}
          {subPlans === null ? (
            <Pressable style={styles.secondary} onPress={onLoadPlans}>
              <Text style={styles.secondaryText}>Load plans</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      <Text style={styles.label}>Referrals</Text>
      {referral && referral.mine.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Your code: {referral.mine[0].code}
          </Text>
          <Text style={styles.cardSub}>Status: {referral.mine[0].status}</Text>
        </View>
      ) : (
        <Pressable style={styles.secondary} onPress={onEnsureReferral}>
          <Text style={styles.secondaryText}>Get my referral code</Text>
        </Pressable>
      )}
      <TextInput
        style={styles.input}
        value={redeemInput}
        onChangeText={onRedeemInput}
        placeholder="Redeem a friend's code"
        placeholderTextColor={colors.ink[500]}
      />
      <Pressable style={styles.primary} onPress={onRedeem}>
        <Text style={styles.primaryText}>Redeem</Text>
      </Pressable>
      {redeemMsg ? <Text style={styles.doneMsg}>{redeemMsg}</Text> : null}

      <Text style={styles.label}>Settings</Text>
      <Pressable style={styles.secondary} onPress={onTogglePromos}>
        <Text style={styles.secondaryText}>
          Promos: {promos ? "ON (tap to mute)" : "OFF (tap to unmute)"}
        </Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onToggleReminders}>
        <Text style={styles.secondaryText}>
          Reminders: {reminders ? "ON (tap to mute)" : "OFF (tap to unmute)"}
        </Text>
      </Pressable>
      <TextInput
        style={styles.input}
        value={reminderTime}
        onChangeText={onReminderTime}
        placeholder="Reminder time HH:MM"
        placeholderTextColor={colors.ink[500]}
      />
      <Pressable style={styles.secondary} onPress={onSaveReminderTime}>
        <Text style={styles.secondaryText}>Save reminder time</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onDeleteData}>
        <Text style={styles.secondaryText}>
          {confirmDelete ? "Tap again to erase my data" : "Delete my data"}
        </Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Home</Text>
      </Pressable>
    </View>
  );
}
