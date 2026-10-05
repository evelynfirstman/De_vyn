import { Pressable, Text, View } from "react-native";
import { styles } from "../styles";
import type { CartItem } from "../types";

type Props = {
  cart: CartItem[];
  totalMinor: number;
  onChangeQty: (sku: string, delta: number) => void;
  onRemove: (sku: string) => void;
  onCheckout: () => void;
  onBack: () => void;
};

export function CartScreen({
  cart,
  totalMinor,
  onChangeQty,
  onRemove,
  onCheckout,
  onBack,
}: Props) {
  return (
    <View>
      <Text style={styles.label}>Your cart</Text>
      {cart.length === 0 ? (
        <Text style={styles.cardSub}>Empty — add recovery gear from Shop.</Text>
      ) : null}
      {cart.map((c) => (
        <View key={c.sku} style={styles.card}>
          <Text style={styles.cardTitle}>{c.title}</Text>
          <Text style={styles.cardSub}>
            {c.currency === "NGN" ? "₦" : `${c.currency} `}
            {(c.amountMinor / 100).toLocaleString()} each
          </Text>
          <View style={styles.row}>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepBtn}
                onPress={() => onChangeQty(c.sku, -1)}
              >
                <Text style={styles.stepText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{c.qty}</Text>
              <Pressable
                style={styles.stepBtn}
                onPress={() => onChangeQty(c.sku, 1)}
              >
                <Text style={styles.stepText}>+</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => onRemove(c.sku)}>
              <Text style={styles.goalDelete}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}
      {cart.length > 0 ? (
        <View>
          <Text style={styles.cardTitle}>
            Total: ₦{totalMinor.toLocaleString()}
          </Text>
          <Pressable style={styles.primary} onPress={onCheckout}>
            <Text style={styles.primaryText}>Checkout</Text>
          </Pressable>
        </View>
      ) : null}
      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Shop</Text>
      </Pressable>
    </View>
  );
}
