import { Pressable, Text, View } from "react-native";
import { styles } from "../styles";
import { LEARN_CATEGORIES } from "../constants";
import { Chip } from "../components/chrome";
import type { Bookmark, LearnDetail, LearnItem, LearnListItem } from "../types";

export type LearnKind = "article" | "video";
export type LearnTab = "articles" | "videos";
export type BookmarkKind = Bookmark["kind"];

type LearnProps = {
  related: LearnItem[] | null;
  items: LearnListItem[] | null;
  category: string;
  tab: LearnTab;
  isBookmarked: (kind: BookmarkKind, refId: number) => boolean;
  onOpenDetail: (kind: LearnKind, slug: string) => void;
  onSelectCategory: (c: string) => void;
  onSelectTab: (t: LearnTab) => void;
  onToggleBookmark: (kind: BookmarkKind, refId: number) => void;
  onBack: () => void;
};

export function LearnScreen({
  related,
  items,
  category,
  tab,
  isBookmarked,
  onOpenDetail,
  onSelectCategory,
  onSelectTab,
  onToggleBookmark,
  onBack,
}: LearnProps) {
  const listKind: LearnKind = tab === "articles" ? "article" : "video";
  return (
    <View>
      <Text style={styles.label}>For you</Text>
      {(related ?? []).slice(0, 3).map((r) => (
        <Pressable
          key={`${r.kind}-${r.slug}`}
          style={styles.card}
          onPress={() => {
            onOpenDetail(r.kind, r.slug);
          }}
        >
          <Text style={styles.cardDay}>
            {r.kind} · {r.matchedTags.join(", ") || "general"}
          </Text>
          <Text style={styles.cardTitle}>{r.title}</Text>
          <Text style={styles.cardSub}>{r.subtitle}</Text>
        </Pressable>
      ))}
      <Text style={styles.label}>Library</Text>
      <View style={styles.chips}>
        {LEARN_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={c}
            selected={category === c}
            onToggle={() => onSelectCategory(c)}
          />
        ))}
      </View>
      <View style={styles.chips}>
        <Chip
          label="Articles"
          selected={tab === "articles"}
          onToggle={() => onSelectTab("articles")}
        />
        <Chip
          label="Videos"
          selected={tab === "videos"}
          onToggle={() => onSelectTab("videos")}
        />
      </View>
      {(items ?? [])
        .filter(
          (item) =>
            category === "All" ||
            item.category.toLowerCase() === category.toLowerCase() ||
            (category === "Product Guides" && tab === "videos"),
        )
        .map((item) => (
          <View key={item.slug} style={styles.card}>
            <Pressable
              onPress={() => {
                onOpenDetail(listKind, item.slug);
              }}
            >
              <Text style={styles.cardDay}>{item.category}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.sub}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onToggleBookmark(listKind, item.id);
              }}
            >
              <Text style={styles.bookmark}>
                {isBookmarked(listKind, item.id) ? "★ Saved" : "☆ Save"}
              </Text>
            </Pressable>
          </View>
        ))}
      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Home</Text>
      </Pressable>
    </View>
  );
}

type DetailProps = {
  detail: LearnDetail;
  relProgs: { slug: string; title: string }[];
  relProds: { sku: string; title: string }[];
  isBookmarked: (kind: BookmarkKind, refId: number) => boolean;
  onToggleBookmark: (kind: BookmarkKind, refId: number) => void;
  onOpenProgram: (slug: string) => void;
  onOpenProduct: (sku: string) => void;
  onBack: () => void;
};

export function LearnDetailScreen({
  detail,
  relProgs,
  relProds,
  isBookmarked,
  onToggleBookmark,
  onOpenProgram,
  onOpenProduct,
  onBack,
}: DetailProps) {
  return (
    <View>
      <Text style={styles.cardDay}>{detail.category}</Text>
      <Text style={styles.label}>{detail.title}</Text>
      {detail.kind === "article" ? (
        <Text style={styles.cardSub}>{detail.body || detail.excerpt}</Text>
      ) : (
        <Text style={styles.cardSub}>
          {detail.playbackUrl ??
            "Video coming soon — media library in progress."}
        </Text>
      )}
      <Pressable
        onPress={() => {
          onToggleBookmark(detail.kind, detail.id);
        }}
      >
        <Text style={styles.bookmark}>
          {isBookmarked(detail.kind, detail.id) ? "★ Saved" : "☆ Save"}
        </Text>
      </Pressable>
      {relProgs.length > 0 ? (
        <View>
          <Text style={styles.label}>Related programs</Text>
          {relProgs.map((p) => (
            <Pressable
              key={p.slug}
              style={styles.card}
              onPress={() => {
                onOpenProgram(p.slug);
              }}
            >
              <Text style={styles.cardTitle}>{p.title}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {relProds.length > 0 ? (
        <View>
          <Text style={styles.label}>Related products</Text>
          {relProds.map((p) => (
            <Pressable
              key={p.sku}
              style={styles.card}
              onPress={() => {
                onOpenProduct(p.sku);
              }}
            >
              <Text style={styles.cardTitle}>{p.title}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Learn</Text>
      </Pressable>
    </View>
  );
}
