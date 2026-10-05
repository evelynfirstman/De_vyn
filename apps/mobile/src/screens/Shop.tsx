import { Pressable, Text, TextInput, View } from "react-native";
import { colors } from "@vyn/tokens";
import { styles } from "../styles";
import { COLLECTIONS, PROBLEM_CHIPS } from "../constants";
import { Chip } from "../components/chrome";
import type { ShopOrder, ShopRec } from "../types";

type CartInput = {
  sku: string;
  title: string;
  amountMinor: number;
  currency: string;
};

type Props = {
  recs: ShopRec[] | null;
  orders: ShopOrder[] | null;
  activeProblem: string | null;
  cartCount: number;
  buyMsg: string | null;
  pendingTx: string | null;
  qrInput: string;
  qrResult: string | null;
  onForMe: () => void;
  onProblemTag: (tag: string) => void;
  onCollectionTag: (tag: string) => void;
  onOpenCart: () => void;
  onOpenProduct: (sku: string) => void;
  onAddToCart: (line: CartInput) => void;
  onCheckPayment: () => void;
  onScanQr: () => void;
  onQrInput: (v: string) => void;
  onResolveQr: () => void;
  onBack: () => void;
};

function price(amountMinor: number, currency: string): string {
  return `${currency === "NGN" ? "₦" : `${currency} `}${(amountMinor / 100).toLocaleString()}`;
}

export function ShopScreen({
  recs,
  orders,
  activeProblem,
  cartCount,
  buyMsg,
  pendingTx,
  qrInput,
  qrResult,
  onForMe,
  onProblemTag,
  onCollectionTag,
  onOpenCart,
  onOpenProduct,
  onAddToCart,
  onCheckPayment,
  onScanQr,
  onQrInput,
  onResolveQr,
  onBack,
}: Props) {
  return (
    <View>
      <Text style={styles.label}>I&apos;m having…</Text>
      <View style={styles.chips}>
        <Chip
          label="For me"
          selected={activeProblem === null}
          onToggle={onForMe}
        />
        {PROBLEM_CHIPS.map((p) => (
          <Chip
            key={p.tag}
            label={p.label}
            selected={activeProblem === p.tag}
            onToggle={() => onProblemTag(p.tag)}
          />
        ))}
      </View>
      <Text style={styles.label}>Collections</Text>
      <View style={styles.chips}>
        {COLLECTIONS.map((c) => (
          <Chip
            key={c.label}
            label={c.label}
            selected={false}
            onToggle={() => onCollectionTag(c.tag)}
          />
        ))}
      </View>
      <Text style={styles.label}>Recommended for you</Text>
      <Pressable style={styles.secondary} onPress={onOpenCart}>
        <Text style={styles.secondaryText}>🛒 Cart ({cartCount})</Text>
      </Pressable>
      {(recs ?? []).map((r) => (
        <View key={r.sku} style={styles.card}>
          <Pressable
            onPress={() => {
              onOpenProduct(r.sku);
            }}
          >
            <Text style={styles.cardDay}>
              {r.isBundle ? "Bundle" : "Product"}
              {r.matchedTags.length > 0
                ? ` · for ${r.matchedTags.join(", ")}`
                : ""}
            </Text>
            <Text style={styles.cardTitle}>{r.title}</Text>
            <Text style={styles.cardSub}>
              {price(r.amountMinor, r.currency)}
              {r.isBundle && r.members.length > 0
                ? ` · ${r.members.length} items`
                : ""}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondary}
            onPress={() => {
              onAddToCart({
                sku: r.sku,
                title: r.title,
                amountMinor: r.amountMinor,
                currency: r.currency,
              });
            }}
          >
            <Text style={styles.secondaryText}>Add to cart</Text>
          </Pressable>
        </View>
      ))}
      {buyMsg ? <Text style={styles.doneMsg}>{buyMsg}</Text> : null}
      {pendingTx ? (
        <Pressable style={styles.primary} onPress={onCheckPayment}>
          <Text style={styles.primaryText}>I&apos;ve paid — check status</Text>
        </Pressable>
      ) : null}

      <Text style={styles.label}>My orders</Text>
      {(orders ?? []).map((o) => (
        <View key={o.id} style={styles.card}>
          <Text style={styles.cardDay}>
            #{o.id} · {o.status} · pay {o.paymentStatus ?? "?"} · ship{" "}
            {o.fulfillmentStatus ?? "—"}
          </Text>
          <Text style={styles.cardTitle}>
            {price(o.amountMinor, o.currency)}
          </Text>
          <Text style={styles.cardSub}>
            {o.items.map((i) => `${i.title} ×${i.qty}`).join(" · ")}
          </Text>
          {o.txRef ? <Text style={styles.cardSub}>{o.txRef}</Text> : null}
        </View>
      ))}

      <Text style={styles.label}>QR code</Text>
      <Pressable style={styles.secondary} onPress={onScanQr}>
        <Text style={styles.secondaryText}>▣ Scan hardware QR</Text>
      </Pressable>
      <TextInput
        style={styles.input}
        value={qrInput}
        onChangeText={onQrInput}
        placeholder="Or enter manually: VYN1-XXXXXXXXXXXX"
        placeholderTextColor={colors.ink[500]}
      />
      <Pressable style={styles.primary} onPress={onResolveQr}>
        <Text style={styles.primaryText}>Resolve</Text>
      </Pressable>
      {qrResult ? <Text style={styles.doneMsg}>{qrResult}</Text> : null}

      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Home</Text>
      </Pressable>
    </View>
  );
}
