import { Pressable, Text, TextInput, View } from "react-native";
import { colors } from "@vyn/tokens";
import { styles } from "../styles";
import type { CartItem } from "../types";

export type Shipping = {
  name: string;
  phone: string;
  address: string;
  city: string;
};

type Props = {
  cart: CartItem[];
  totalMinor: number;
  shipping: Shipping;
  busy: boolean;
  buyMsg: string | null;
  pendingTx: string | null;
  onShipping: (patch: Partial<Shipping>) => void;
  onPay: () => void;
  onCheckPayment: () => void;
  onBack: () => void;
};

export function CheckoutScreen({
  cart,
  totalMinor,
  shipping,
  busy,
  buyMsg,
  pendingTx,
  onShipping,
  onPay,
  onCheckPayment,
  onBack,
}: Props) {
  const empty = cart.length === 0;
  return (
    <View>
      <Text style={styles.label}>Delivery details</Text>
      <TextInput
        style={styles.input}
        value={shipping.name}
        onChangeText={(v) => onShipping({ name: v })}
        placeholder="Full name"
        placeholderTextColor={colors.ink[500]}
      />
      <TextInput
        style={styles.input}
        value={shipping.phone}
        onChangeText={(v) => onShipping({ phone: v })}
        placeholder="Phone"
        placeholderTextColor={colors.ink[500]}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        value={shipping.address}
        onChangeText={(v) => onShipping({ address: v })}
        placeholder="Street address"
        placeholderTextColor={colors.ink[500]}
      />
      <TextInput
        style={styles.input}
        value={shipping.city}
        onChangeText={(v) => onShipping({ city: v })}
        placeholder="City"
        placeholderTextColor={colors.ink[500]}
      />
      <Text style={styles.label}>Order review</Text>
      {cart.map((c) => (
        <Text key={c.sku} style={styles.cardSub}>
          {c.title} ×{c.qty} — ₦
          {((c.amountMinor * c.qty) / 100).toLocaleString()}
        </Text>
      ))}
      <Text style={styles.cardTitle}>
        Total: ₦{totalMinor.toLocaleString()}
      </Text>
      {buyMsg ? <Text style={styles.doneMsg}>{buyMsg}</Text> : null}
      {pendingTx ? (
        <Pressable style={styles.primary} onPress={onCheckPayment}>
          <Text style={styles.primaryText}>I&apos;ve paid — check status</Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.primary}
          onPress={onPay}
          disabled={busy || empty}
        >
          <Text style={styles.primaryText}>
            {busy ? "Creating order…" : "Pay with Flutterwave"}
          </Text>
        </Pressable>
      )}
      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Cart</Text>
      </Pressable>
    </View>
  );
}
