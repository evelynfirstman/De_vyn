import { Pressable, Text, View } from "react-native";
import { styles } from "../styles";
import type { WishlistItem } from "../types";

type Props = {
  items: WishlistItem[];
  onOpenProduct: (slug: string) => void;
  onOpenProgram: (slug: string) => void;
  onBack: () => void;
};

export function WishlistScreen({
  items,
  onOpenProduct,
  onOpenProgram,
  onBack,
}: Props) {
  const products = items.filter((w) => w.kind === "product");
  const programs = items.filter((w) => w.kind === "program");
  return (
    <View>
      <Text style={styles.label}>Saved products</Text>
      {products.length === 0 ? (
        <Text style={styles.cardSub}>
          Nothing saved yet — tap ☆ on any product.
        </Text>
      ) : null}
      {products.map((w) => (
        <Pressable
          key={w.id}
          style={styles.card}
          onPress={() => {
            onOpenProduct(w.slug ?? "");
          }}
        >
          <Text style={styles.cardTitle}>{w.title ?? w.slug}</Text>
        </Pressable>
      ))}
      <Text style={styles.label}>Saved programs</Text>
      {programs.length === 0 ? (
        <Text style={styles.cardSub}>
          Nothing saved yet — tap ☆ on any program.
        </Text>
      ) : null}
      {programs.map((w) => (
        <Pressable
          key={w.id}
          style={styles.card}
          onPress={() => {
            onOpenProgram(w.slug ?? "");
          }}
        >
          <Text style={styles.cardTitle}>{w.title ?? w.slug}</Text>
        </Pressable>
      ))}
      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Shop</Text>
      </Pressable>
    </View>
  );
}
