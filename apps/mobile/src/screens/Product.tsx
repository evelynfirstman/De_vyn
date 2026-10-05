import { Pressable, Text, View } from "react-native";
import { styles } from "../styles";
import type { ProductDetail } from "../types";

type Props = {
  product: ProductDetail;
  onOpenGuide: (kind: "article" | "video", slug: string) => void;
  onOpenProgram: (slug: string) => void;
  onOpenProduct: (sku: string) => void;
  onAddToCart: () => void;
  onBack: () => void;
};

export function ProductScreen({
  product,
  onOpenGuide,
  onOpenProgram,
  onOpenProduct,
  onAddToCart,
  onBack,
}: Props) {
  return (
    <View>
      <Text style={styles.cardDay}>
        {product.isBundle ? "Bundle" : "Product"} ·{" "}
        {product.problemTags.join(", ")}
      </Text>
      <Text style={styles.label}>{product.title}</Text>
      <Text style={styles.cardTitle}>
        {product.currency === "NGN" ? "₦" : `${product.currency} `}
        {(product.amountMinor / 100).toLocaleString()}
      </Text>
      {product.isBundle && product.members.length > 0 ? (
        <View>
          <Text style={styles.label}>In this bundle</Text>
          {product.members.map((m) => (
            <Text key={m.sku} style={styles.cardSub}>
              • {m.title ?? m.sku} ×{m.qty}
            </Text>
          ))}
        </View>
      ) : null}
      {product.guides.length > 0 ? (
        <View>
          <Text style={styles.label}>Guides & how to use</Text>
          {product.guides.map((g) => (
            <Pressable
              key={`${g.kind}-${g.slug}`}
              style={styles.card}
              onPress={() => {
                onOpenGuide(g.kind as "article" | "video", g.slug);
              }}
            >
              <Text style={styles.cardDay}>
                {g.kind} guide — from your product QR
              </Text>
              <Text style={styles.cardTitle}>{g.title}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {product.routines.length > 0 ? (
        <View>
          <Text style={styles.label}>Recovery routines</Text>
          {product.routines.map((r) => (
            <Pressable
              key={r.slug}
              style={styles.card}
              onPress={() => {
                onOpenProgram(r.slug);
              }}
            >
              <Text style={styles.cardTitle}>{r.title}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {product.related.length > 0 ? (
        <View>
          <Text style={styles.label}>Related products</Text>
          {product.related.map((r) => (
            <Pressable
              key={r.sku}
              style={styles.card}
              onPress={() => {
                onOpenProduct(r.sku);
              }}
            >
              <Text style={styles.cardTitle}>{r.title}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text style={styles.cardSub}>
        Reviews and FAQs appear once owners start rating.
      </Text>
      <Pressable style={styles.primary} onPress={onAddToCart}>
        <Text style={styles.primaryText}>Add to cart</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Shop</Text>
      </Pressable>
    </View>
  );
}
