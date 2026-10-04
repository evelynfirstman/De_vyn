import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, scoreBandFor } from "@vyn/tokens";
import { bandColor, fontFamily } from "./theme";
import {
  Logo,
  OnboardingProgress,
  QrScannerModal,
  RoutineHeroCard,
  ScoreRing,
  StreakDots,
  StreakPill,
} from "./components/RNUI";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";

// Demo actor until Better Auth lands (Phase 2b).
const DEMO_USER_ID = 1;
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

type Screen =
  | "splash"
  | "welcome"
  | "about"
  | "owned"
  | "profile"
  | "assessment"
  | "plan"
  | "home"
  | "recover"
  | "program"
  | "feedback"
  | "done"
  | "learn"
  | "learnDetail"
  | "shop"
  | "product"
  | "progress"
  | "account"
  | "wishlist"
  | "support"
  | "notifications"
  | "coach";

type PlanItem = {
  day: string;
  programId: number;
  slug: string;
  title: string;
  durationMin: number;
};

type Plan = {
  id: number;
  items: PlanItem[];
  rationale: string;
};

type HomeData = {
  date: string;
  weekday: string;
  todaySession: {
    day: string;
    title: string;
    durationMin: number;
    slug: string;
  } | null;
  score: { score: number; band: string } | null;
  streak: { count: number; lastDate: string | null };
  checkIn: { soreness: number; sleepHours: string; stress: number } | null;
};

type LearnItem = {
  kind: "article" | "video";
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  matchedTags: string[];
};

type LearnListItem = {
  id: number;
  slug: string;
  title: string;
  sub: string;
  category: string;
};

type LearnDetail =
  | {
      kind: "article";
      id: number;
      slug: string;
      title: string;
      excerpt: string;
      body: string;
      category: string;
      tags: string[];
    }
  | {
      kind: "video";
      id: number;
      slug: string;
      title: string;
      description: string;
      durationSec: number;
      playbackUrl: string | null;
      category: string;
      tags: string[];
    };

type Bookmark = {
  id: number;
  kind: "article" | "video";
  refId: number;
};

type ShopRec = {
  sku: string;
  title: string;
  amountMinor: number;
  currency: string;
  isBundle: boolean;
  members: { sku: string; qty: number }[];
  matchedTags: string[];
  score: number;
};

type ShopOrder = {
  id: number;
  status: string;
  amountMinor: number;
  currency: string;
  items: { sku: string; title: string; qty: number; unitMinor: number }[];
  paymentStatus: string | null;
  txRef: string | null;
  fulfillmentStatus: string | null;
  bridgeRef: string | null;
};

type Goal = {
  id: number;
  title: string;
  targetPerWeek: number;
  done: boolean;
};

type NotificationItem = {
  id: number;
  kind: string;
  title: string;
  body: string;
  read: boolean;
};

type ProgressData = {
  scores: { date: string; score: number; band: string }[];
  completionsByDay: { date: string; count: number }[];
  streak: { count: number; lastDate: string | null };
  milestones: { kind: string; label: string; achievedAt: string }[];
};

type Rec = {
  kind: string;
  title: string;
  reason: string;
  action: { screen: string; slug?: string };
};

type Explanation = {
  summary: string;
  reasons: string[];
  sources: { title: string; source: string }[];
  disclaimer: string;
  escalation: string;
};

type SubPlan = {
  id: number;
  name: string;
  amountMinor: number;
  currency: string;
  interval: string;
};

type Entitlement = {
  premium: boolean;
  subscription: { planName: string; status: string } | null;
};

type ReferralInfo = {
  mine: { code: string; status: string }[];
  referredBy: { code: string }[];
};

type ProductDetail = {
  id: number;
  sku: string;
  title: string;
  amountMinor: number;
  currency: string;
  isBundle: boolean;
  problemTags: string[];
  guides: { kind: string; id: number; slug: string; title: string }[];
  routines: { id: number; slug: string; title: string; duration_min: number }[];
  related: {
    sku: string;
    title: string;
    amountMinor: number;
    currency: string;
  }[];
  members: { sku: string; title: string | null; qty: number }[];
};

type WishlistItem = {
  id: number;
  kind: "article" | "video" | "product";
  refId: number;
  title: string | null;
  slug: string | null;
};

type Ticket = {
  id: number;
  subject: string;
  message: string;
  status: string;
};

type GameState = {
  xp: number;
  level: number;
  xpToNext: number;
  badges: { id: string; title: string; earned: boolean }[];
  challenges: {
    id: string;
    title: string;
    target: number;
    progress: number;
    done: boolean;
  }[];
};

type DailyTip = {
  title: string;
  body: string;
  source: string;
};

type HistoryItem = {
  programId: number;
  completedAt: string;
};

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; source: string }[];
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

type ProgramStep = {
  name: string;
  seconds: number;
};

type Program = {
  id: number;
  slug: string;
  title: string;
  description: string;
  level: string;
  duration_min: number;
  steps: ProgramStep[];
  equipment: string[];
  problemTags: string[];
};

type QueuedCompletion = {
  userId: number;
  programId: number;
  durationSec: number;
  queuedAt: string;
};

const QUEUE_KEY = "vyn:pending-completions";

async function readQueue(): Promise<QueuedCompletion[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedCompletion[]) : [];
  } catch {
    return [];
  }
}

/** Push queued completions to the API; stops at first failure (offline). */
async function flushQueue(): Promise<number> {
  const queue = await readQueue();
  let sent = 0;
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      await postJson("/v1/sessions/complete", {
        userId: item.userId,
        programId: item.programId,
        durationSec: item.durationSec,
      });
      sent += 1;
    } catch {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(i)));
      return sent;
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
  return sent;
}

const GOAL_OPTIONS = [
  "Neck relief",
  "Back relief",
  "Better posture",
  "Move daily",
];
const PAIN_OPTIONS = ["neck", "lower-back", "shoulders", "posture"];

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    data?: unknown;
    error?: { message: string };
  };
  if (!res.ok)
    throw new Error(json.error?.message ?? `Request failed (${res.status})`);
  return json.data;
}

async function getJson(path: string) {
  const res = await fetch(`${API_URL}${path}`);
  const json = (await res.json()) as {
    data?: unknown;
    error?: { message: string };
  };
  if (!res.ok)
    throw new Error(json.error?.message ?? `Request failed (${res.status})`);
  return json.data;
}

async function putJson(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    data?: unknown;
    error?: { message: string };
  };
  if (!res.ok)
    throw new Error(json.error?.message ?? `Request failed (${res.status})`);
  return json.data;
}

function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function NumberRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(Math.max(min, value - 1))}
        >
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(Math.min(max, value + 1))}
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const TABS: { screen: Screen; label: string; icon: string }[] = [
  { screen: "home", label: "Home", icon: "⌂" },
  { screen: "recover", label: "Recover", icon: "◉" },
  { screen: "learn", label: "Learn", icon: "▶" },
  { screen: "shop", label: "Shop", icon: "◈" },
  { screen: "progress", label: "Progress", icon: "▲" },
];

const MOODS = [
  { value: 1, emoji: "😁", label: "Great" },
  { value: 2, emoji: "🙂", label: "Good" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😣", label: "Sore" },
  { value: 5, emoji: "😫", label: "Very sore" },
];

const ACTIVITY_LEVELS = [
  "Mostly sitting",
  "Lightly active",
  "Active",
  "Very active",
];

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state: { error: string | null } = { error: null };

  static getDerivedStateFromError(e: unknown): { error: string } {
    return { error: e instanceof Error ? e.message : String(e) };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ padding: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>
            Something broke on this screen
          </Text>
          <Text style={{ marginTop: 8 }}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const PROBLEM_CHIPS = [
  { label: "Neck pain", tag: "neck" },
  { label: "Back pain", tag: "lower-back" },
  { label: "Shoulders", tag: "shoulders" },
  { label: "Posture", tag: "posture" },
];

const COLLECTIONS = [
  { label: "For Developers", tag: "neck" },
  { label: "For Remote Workers", tag: "posture" },
  { label: "For Travelers", tag: "lower-back" },
  { label: "For Gym Recovery", tag: "sitting" },
];

const LEARN_CATEGORIES = [
  "All",
  "Recovery Basics",
  "Desk Health",
  "Mobility",
  "Sleep",
  "Hydration",
  "Stress",
  "Posture",
  "Product Guides",
];

function TabBar({
  screen,
  onGo,
}: {
  screen: Screen;
  onGo: (s: Screen) => void;
}) {
  const active: Screen[] = [
    "home",
    "recover",
    "program",
    "learn",
    "learnDetail",
    "shop",
    "product",
    "progress",
    "account",
    "wishlist",
    "support",
    "notifications",
  ];
  if (!active.includes(screen)) return null;
  const current =
    screen === "program"
      ? "recover"
      : screen === "learnDetail"
        ? "learn"
        : screen === "product"
          ? "shop"
          : (screen as Screen);
  return (
    <View style={styles.tabBar}>
      {TABS.map((t) => (
        <Pressable
          key={t.screen}
          style={styles.tab}
          onPress={() => onGo(t.screen)}
        >
          <Text style={styles.tabIcon}>{t.icon}</Text>
          <Text
            style={[styles.tabLabel, current === t.screen && styles.tabActive]}
          >
            {t.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Drawer({
  open,
  onClose,
  onGo,
  onSignOut,
}: {
  open: boolean;
  onClose: () => void;
  onGo: (s: Screen) => void;
  onSignOut: () => void;
}) {
  if (!open) return null;
  const items: { label: string; go: Screen | null }[] = [
    { label: "🤖 AI Coach", go: "coach" },
    { label: "💳 Subscription & Premium", go: "account" },
    { label: "🤍 Wishlist", go: "wishlist" },
    { label: "🔔 Notifications", go: "notifications" },
    { label: "🛟 Support", go: "support" },
    { label: "⚙️ Settings", go: "account" },
    { label: "🚪 Sign out (demo)", go: null },
  ];
  return (
    <View style={styles.drawerOverlay}>
      <Pressable style={styles.drawerScrim} onPress={onClose} />
      <View style={styles.drawer}>
        <Text style={styles.drawerTitle}>Vyn Therapy</Text>
        {items.map((item) => (
          <Pressable
            key={item.label}
            style={styles.drawerItem}
            onPress={() => {
              onClose();
              if (item.go) onGo(item.go);
              else onSignOut();
            }}
          >
            <Text style={styles.drawerText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function AppHeader({
  title,
  onMenu,
  onBell,
  unread,
}: {
  title: string;
  onMenu?: () => void;
  onBell?: () => void;
  unread?: number;
}) {
  return (
    <View style={styles.header}>
      {onMenu ? (
        <Pressable style={styles.headerBtn} onPress={onMenu}>
          <Text style={styles.headerIcon}>☰</Text>
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      {onBell ? (
        <Pressable style={styles.headerBtn} onPress={onBell}>
          <Text style={styles.headerIcon}>
            🔔{unread ? ` (${unread})` : ""}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const [screen, setScreen] = useState<Screen>("splash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [goals, setGoals] = useState<string[]>([]);
  const [painAreas, setPainAreas] = useState<string[]>(["neck"]);
  const [minutes, setMinutes] = useState(15);
  const [days, setDays] = useState(3);

  const [soreness, setSoreness] = useState(3);
  const [sleep, setSleep] = useState("7");
  const [stress, setStress] = useState(3);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [weekPlan, setWeekPlan] = useState<PlanItem[] | null>(null);
  const [home, setHome] = useState<HomeData | null>(null);

  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [finished, setFinished] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const [learnTab, setLearnTab] = useState<"articles" | "videos">("articles");
  const [learnCat, setLearnCat] = useState("All");
  const [learnItems, setLearnItems] = useState<LearnListItem[] | null>(null);
  const [learnDetail, setLearnDetail] = useState<LearnDetail | null>(null);
  const [learnRelProgs, setLearnRelProgs] = useState<
    { slug: string; title: string }[]
  >([]);
  const [learnRelProds, setLearnRelProds] = useState<
    { sku: string; title: string }[]
  >([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [related, setRelated] = useState<LearnItem[] | null>(null);
  const [shopRecs, setShopRecs] = useState<ShopRec[] | null>(null);
  const [shopOrders, setShopOrders] = useState<ShopOrder[] | null>(null);
  const [qrInput, setQrInput] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [buyMsg, setBuyMsg] = useState<string | null>(null);
  const [pendingTx, setPendingTx] = useState<string | null>(null);
  const [shopProblem, setShopProblem] = useState<string | null>(null);

  async function loadShopProblem(tag: string | null) {
    setBusy(true);
    setError(null);
    try {
      const url =
        tag === null
          ? `/v1/shop/recommendations?userId=${DEMO_USER_ID}`
          : `/v1/shop/recommendations?problem=${encodeURIComponent(tag)}`;
      const data = (await getJson(url)) as { data: ShopRec[] };
      setShopRecs(data.data);
      setShopProblem(tag);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [subPlans, setSubPlans] = useState<SubPlan[] | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [redeemInput, setRedeemInput] = useState("");
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);
  const [promos, setPromos] = useState(true);
  const [reminders, setReminders] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [occupation, setOccupation] = useState("");
  const [activityLevel, setActivityLevel] = useState("Mostly sitting");
  const [productsOwned, setProductsOwned] = useState<string[]>([]);
  const [ownedOptions, setOwnedOptions] = useState<string[]>([]);
  const [recoverTag, setRecoverTag] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [lastGain, setLastGain] = useState<number | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [notifyList, setNotifyList] = useState<NotificationItem[]>([]);
  const [game, setGame] = useState<GameState | null>(null);
  const [tip, setTip] = useState<DailyTip | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [recs, setRecs] = useState<Rec[] | null>(null);
  const [homeRecs, setHomeRecs] = useState<ShopRec[] | null>(null);
  const [goalList, setGoalList] = useState<Goal[] | null>(null);
  const [newGoal, setNewGoal] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  function isBookmarked(
    kind: "article" | "video" | "product",
    refId: number,
  ): boolean {
    return bookmarks.some((b) => b.kind === kind && b.refId === refId);
  }

  const toggle = (list: string[], v: string, set: (l: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  useEffect(() => {
    if (screen !== "splash") return;
    const t = setTimeout(() => setScreen("welcome"), 1200);
    return () => clearTimeout(t);
  }, [screen]);

  async function loadOwnedOptions() {
    try {
      const data = (await getJson("/v1/products?pageSize=50")) as {
        data: { sku: string }[];
      };
      setOwnedOptions(data.data.map((p) => p.sku));
    } catch {
      setOwnedOptions([]);
    }
  }

  async function saveProfile() {
    setBusy(true);
    setError(null);
    try {
      await putJson("/v1/profiles", {
        userId: DEMO_USER_ID,
        goals,
        painAreas,
        equipment: [],
        minutesPerSession: minutes,
        daysPerWeek: days,
        occupation,
        activityLevel,
        productsOwned,
      });
      setScreen("assessment");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveAssessment() {
    setBusy(true);
    setError(null);
    try {
      await postJson("/v1/assessments", {
        userId: DEMO_USER_ID,
        soreness,
        sleepHours: Number(sleep) || 0,
        stress,
        activity: "",
        painAreas,
      });
      const generated = (await postJson("/v1/plans/generate", {
        userId: DEMO_USER_ID,
      })) as Plan;
      setPlan(generated);
      setScreen("plan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function openHome() {
    setBusy(true);
    setError(null);
    try {
      const [homeData, tipData, historyData, planData, notifyData, recData] =
        await Promise.all([
          getJson(
            `/v1/home?userId=${DEMO_USER_ID}&date=${todayStr()}`,
          ) as Promise<HomeData>,
          getJson("/v1/daily-tip") as Promise<DailyTip>,
          getJson(
            `/v1/sessions/history?userId=${DEMO_USER_ID}&limit=50`,
          ) as Promise<HistoryItem[]>,
          getJson(`/v1/plans/latest?userId=${DEMO_USER_ID}`).catch(
            () => null,
          ) as Promise<{ items: PlanItem[] } | null>,
          getJson(`/v1/notifications?userId=${DEMO_USER_ID}`) as Promise<{
            data: NotificationItem[];
          }>,
          getJson(
            `/v1/shop/recommendations?userId=${DEMO_USER_ID}`,
          ) as Promise<{ data: ShopRec[] }>,
        ]);
      setHome(homeData);
      setTip(tipData);
      setHistory(historyData);
      setWeekPlan(planData?.items ?? null);
      setNotifyList(
        Array.isArray(notifyData)
          ? notifyData
          : ((notifyData as unknown as { data?: NotificationItem[] })?.data ??
              []),
      );
      setHomeRecs(
        Array.isArray(recData)
          ? recData
          : ((recData as unknown as { data?: ShopRec[] })?.data ?? []),
      );
      setScreen("home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (screen === "home" && home === null && !busy) {
      openHome();
    }
  }, [screen]);

  useEffect(() => {
    if (screen === "wishlist") void loadWishlist();
    if (screen === "support") void loadTickets();
    if (screen === "notifications") void loadNotifyList();
    if (screen === "progress" && game === null) void loadGame();
  }, [screen]);

  async function submitCheckIn() {
    setBusy(true);
    setError(null);
    try {
      await postJson("/v1/check-ins", {
        userId: DEMO_USER_ID,
        date: todayStr(),
        soreness,
        sleepHours: Number(sleep) || 0,
        stress,
        activity: "",
        timezone: "UTC",
      });
      const data = (await getJson(
        `/v1/home?userId=${DEMO_USER_ID}&date=${todayStr()}`,
      )) as HomeData;
      setHome(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function delJson(path: string, body: unknown) {
    const res = await fetch(`${API_URL}${path}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 204) return null;
    const json = (await res.json()) as {
      data?: unknown;
      error?: { message: string };
    };
    if (!res.ok)
      throw new Error(json.error?.message ?? `Request failed (${res.status})`);
    return json.data;
  }

  async function refreshPending() {
    setPendingCount((await readQueue()).length);
  }

  async function loadPrograms() {
    setBusy(true);
    setError(null);
    try {
      const data = (await getJson("/v1/programs?pageSize=50")) as {
        data: Program[];
      };
      setPrograms(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  async function openProgram(slug: string) {
    setBusy(true);
    setError(null);
    setDoneMsg(null);
    try {
      const data = (await getJson(`/v1/programs/${slug}`)) as Program;
      setSelectedProgram(data);
      setStepIdx(0);
      setSecondsLeft(data.steps.length > 0 ? data.steps[0].seconds : 0);
      setTimerOn(false);
      setFinished(data.steps.length === 0);
      setScreen("program");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  function skipStep() {
    if (selectedProgram === null) return;
    if (stepIdx >= selectedProgram.steps.length - 1) {
      setTimerOn(false);
      setFinished(true);
    } else {
      const next = stepIdx + 1;
      setStepIdx(next);
      setSecondsLeft(selectedProgram.steps[next].seconds);
    }
  }

  async function completeSession() {
    if (selectedProgram === null) return;
    setBusy(true);
    setError(null);
    setDoneMsg(null);
    const total = selectedProgram.steps.reduce((a, s) => a + s.seconds, 0);
    const before = home?.score?.score ?? null;
    const payload = {
      userId: DEMO_USER_ID,
      programId: selectedProgram.id,
      durationSec: total,
      rating,
      feedback,
    };
    try {
      await postJson("/v1/sessions/complete", payload);
      const sent = await flushQueue();
      await refreshPending();
      try {
        const data = (await getJson(
          `/v1/home?userId=${DEMO_USER_ID}&date=${todayStr()}`,
        )) as HomeData;
        setHome(data);
        setLastGain(
          before !== null && data.score ? data.score.score - before : null,
        );
      } catch {
        setLastGain(null);
      }
      setDoneMsg(sent > 0 ? `Saved ✓ (+${sent} queued synced)` : "Saved ✓");
      setScreen("done");
    } catch {
      const queue = await readQueue();
      queue.push({
        userId: payload.userId,
        programId: payload.programId,
        durationSec: payload.durationSec,
        queuedAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      await refreshPending();
      setDoneMsg("Offline — saved on device, will sync");
      setScreen("done");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (screen === "recover" && programs === null && !busy) {
      void loadPrograms();
    }
  }, [screen, programs, busy]);

  async function loadLearnScreen(tab: "articles" | "videos") {
    setBusy(true);
    setError(null);
    try {
      const [itemsRes, relatedRes, bookmarkRes] = await Promise.all([
        getJson(`/v1/${tab}?pageSize=50`) as Promise<{
          data: {
            id: number;
            slug: string;
            title: string;
            excerpt?: string;
            description?: string;
            category: string;
          }[];
        }>,
        getJson(`/v1/learn/related?userId=${DEMO_USER_ID}`) as Promise<{
          data: LearnItem[];
        }>,
        getJson(`/v1/bookmarks?userId=${DEMO_USER_ID}`) as Promise<{
          data: Bookmark[];
        }>,
      ]);
      setLearnItems(
        itemsRes.data.map((r) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          sub: r.excerpt ?? r.description ?? "",
          category: r.category,
        })),
      );
      setLearnTab(tab);
      setRelated(relatedRes.data);
      setBookmarks(bookmarkRes.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadRelatedFor(tags: string[]) {
    if (tags.length === 0) {
      setLearnRelProgs([]);
      setLearnRelProds([]);
      return;
    }
    try {
      const [progs, prods] = await Promise.all([
        getJson(`/v1/programs?tags=${tags.join(",")}&pageSize=3`) as Promise<{
          data: { slug: string; title: string }[];
        }>,
        getJson("/v1/products?pageSize=50") as Promise<{
          data: { sku: string; title: string; problem_tags?: string[] }[];
        }>,
      ]);
      setLearnRelProgs(progs.data);
      setLearnRelProds(
        prods.data
          .filter((p) => (p.problem_tags ?? []).some((t) => tags.includes(t)))
          .slice(0, 3),
      );
    } catch {
      setLearnRelProgs([]);
      setLearnRelProds([]);
    }
  }

  async function openLearnDetail(kind: "article" | "video", slug: string) {
    setBusy(true);
    setError(null);
    try {
      if (kind === "article") {
        const data = (await getJson(`/v1/articles/${slug}`)) as {
          id: number;
          slug: string;
          title: string;
          excerpt: string;
          body: string;
          category: string;
          tags: string[];
        };
        setLearnDetail({ kind, ...data });
        await loadRelatedFor(data.tags);
      } else {
        const data = (await getJson(`/v1/videos/${slug}`)) as {
          id: number;
          slug: string;
          title: string;
          description: string;
          durationSec: number;
          playbackUrl: string | null;
          category: string;
          tags: string[];
        };
        setLearnDetail({ kind, ...data });
        await loadRelatedFor(data.tags);
      }
      setScreen("learnDetail");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleBookmark(
    kind: "article" | "video" | "product",
    refId: number,
  ) {
    setError(null);
    try {
      if (isBookmarked(kind, refId)) {
        await delJson("/v1/bookmarks", { userId: DEMO_USER_ID, kind, refId });
      } else {
        await postJson("/v1/bookmarks", { userId: DEMO_USER_ID, kind, refId });
      }
      const data = (await getJson(`/v1/bookmarks?userId=${DEMO_USER_ID}`)) as {
        data: Bookmark[];
      };
      setBookmarks(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bookmark failed");
    }
  }

  async function loadShopScreen() {
    setBusy(true);
    setError(null);
    try {
      const [recs, orders] = await Promise.all([
        getJson(`/v1/shop/recommendations?userId=${DEMO_USER_ID}`) as Promise<{
          data: ShopRec[];
        }>,
        getJson(`/v1/shop/orders?userId=${DEMO_USER_ID}`) as Promise<{
          data: ShopOrder[];
        }>,
      ]);
      setShopRecs(recs.data);
      setShopOrders(orders.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  async function buy(sku: string) {
    setBusy(true);
    setError(null);
    setBuyMsg(null);
    try {
      const data = (await postJson("/v1/shop/checkout", {
        userId: DEMO_USER_ID,
        items: [{ sku, qty: 1 }],
        shipping: {},
      })) as {
        order: { id: number };
        payment: { txRef: string; paymentUrl: string | null };
      };
      if (data.payment.paymentUrl) {
        setPendingTx(data.payment.txRef);
        setBuyMsg(`Order #${data.order.id} created — completing payment…`);
        await WebBrowser.openBrowserAsync(data.payment.paymentUrl);
        setBuyMsg(
          `Order #${data.order.id} — finish payment in the browser, then tap “Check status”.`,
        );
      } else {
        setBuyMsg(
          `Order #${data.order.id} created · ${data.payment.txRef} · test mode: no live payment link`,
        );
      }
      const orders = (await getJson(
        `/v1/shop/orders?userId=${DEMO_USER_ID}`,
      )) as { data: ShopOrder[] };
      setShopOrders(orders.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  async function checkPayment(txRef: string) {
    setError(null);
    try {
      const data = (await getJson(
        `/v1/shop/payments/status?txRef=${encodeURIComponent(txRef)}`,
      )) as { kind: string; status: string };
      if (data.status === "paid" || data.status === "active") {
        setPendingTx(null);
        setBuyMsg("Payment confirmed ✓ — order is on its way.");
        const orders = (await getJson(
          `/v1/shop/orders?userId=${DEMO_USER_ID}`,
        )) as { data: ShopOrder[] };
        setShopOrders(orders.data);
      } else {
        setBuyMsg(`Still ${data.status} — finish payment, then check again.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status check failed");
    }
  }

  async function submitQr() {
    setError(null);
    setQrResult(null);
    try {
      const data = (await getJson(
        `/v1/qr/resolve?code=${encodeURIComponent(qrInput.trim())}`,
      )) as { kind: string; ref: string; path: string };
      if (data.kind === "program") {
        await openProgram(data.ref);
      } else {
        await openProduct(data.ref);
      }
    } catch {
      setQrResult("Code not recognized");
    }
  }

  async function openProduct(sku: string) {
    setBusy(true);
    setError(null);
    try {
      const data = (await getJson(`/v1/products/${sku}`)) as ProductDetail;
      setProduct(data);
      setScreen("product");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadWishlist() {
    setError(null);
    try {
      const data = (await getJson(
        `/v1/bookmarks?userId=${DEMO_USER_ID}&kind=product`,
      )) as { data: WishlistItem[] };
      setWishlist(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  async function loadTickets() {
    setError(null);
    try {
      const data = (await getJson(`/v1/tickets?userId=${DEMO_USER_ID}`)) as {
        data: Ticket[];
      };
      setTickets(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  async function submitTicket() {
    const subject = ticketSubject.trim();
    if (!subject) return;
    setError(null);
    try {
      await postJson("/v1/tickets", {
        userId: DEMO_USER_ID,
        subject,
        message: ticketMessage,
      });
      setTicketSubject("");
      setTicketMessage("");
      await loadTickets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    }
  }

  async function loadNotifyList() {
    setError(null);
    try {
      const data = (await getJson(
        `/v1/notifications?userId=${DEMO_USER_ID}`,
      )) as unknown as NotificationItem[] | { data?: NotificationItem[] };
      setNotifyList(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  async function loadGame() {
    try {
      const data = (await getJson(
        `/v1/gamification?userId=${DEMO_USER_ID}`,
      )) as { data: GameState };
      setGame(data.data);
    } catch {
      setGame(null);
    }
  }

  async function loadProgressScreen() {
    setBusy(true);
    setError(null);
    try {
      const [progressRes, recsRes, goalsRes, notifRes, ordersRes] =
        await Promise.all([
          getJson(`/v1/progress?userId=${DEMO_USER_ID}`) as Promise<{
            data: ProgressData;
          }>,
          getJson(`/v1/recommendations?userId=${DEMO_USER_ID}`) as Promise<{
            data: Rec[];
          }>,
          getJson(`/v1/goals?userId=${DEMO_USER_ID}`) as Promise<{
            data: Goal[];
          }>,
          getJson(`/v1/notifications?userId=${DEMO_USER_ID}`) as Promise<{
            data: NotificationItem[];
          }>,
          getJson(`/v1/shop/orders?userId=${DEMO_USER_ID}`) as Promise<{
            data: ShopOrder[];
          }>,
        ]);
      setProgress(progressRes.data);
      setRecs(recsRes.data);
      setGoalList(goalsRes.data);
      setNotifications(notifRes.data);
      setShopOrders(ordersRes.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  async function addGoal() {
    const title = newGoal.trim();
    if (!title) return;
    setError(null);
    try {
      await postJson("/v1/goals", { userId: DEMO_USER_ID, title });
      setNewGoal("");
      const data = (await getJson(`/v1/goals?userId=${DEMO_USER_ID}`)) as {
        data: Goal[];
      };
      setGoalList(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add failed");
    }
  }

  async function toggleGoal(goal: Goal) {
    setError(null);
    try {
      await putJson(`/v1/goals/${goal.id}`, {
        userId: DEMO_USER_ID,
        done: !goal.done,
      });
      setGoalList((prev) =>
        prev === null
          ? prev
          : prev.map((g) => (g.id === goal.id ? { ...g, done: !g.done } : g)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function removeGoal(id: number) {
    setError(null);
    try {
      await delJson(`/v1/goals/${id}?userId=${DEMO_USER_ID}`, {});
      setGoalList((prev) =>
        prev === null ? prev : prev.filter((g) => g.id !== id),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function markAllRead() {
    setError(null);
    try {
      await postJson("/v1/notifications/read", { userId: DEMO_USER_ID });
      const data = (await getJson(
        `/v1/notifications?userId=${DEMO_USER_ID}`,
      )) as { data: NotificationItem[] };
      setNotifications(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function deleteMyData() {
    setError(null);
    try {
      await delJson(`/v1/users/${DEMO_USER_ID}/data`, {});
      setProgress(null);
      setRecs(null);
      setGoalList(null);
      setNotifications(null);
      setConfirmDelete(false);
      setScreen("profile");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  function openRec(rec: Rec) {
    if (rec.action.screen === "program" && rec.action.slug) {
      void openProgram(rec.action.slug);
    } else if (rec.action.screen === "shop") {
      setScreen("shop");
    } else if (rec.action.screen === "learn") {
      setScreen("learn");
    } else {
      setScreen("home");
    }
  }

  useEffect(() => {
    if (
      (screen === "progress" || screen === "account") &&
      (progress === null || goalList === null) &&
      !busy
    ) {
      void loadProgressScreen();
    }
    if (screen === "account" && subPlans === null && !busy) {
      void loadAccountExtras();
      void loadPrefs();
    }
  }, [screen]);

  async function loadExplanation(planId: number) {
    setError(null);
    try {
      const data = (await getJson(
        `/v1/plans/${planId}/explanation`,
      )) as Explanation;
      setExplanation(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  async function loadAccountExtras() {
    setError(null);
    try {
      const [plansRes, entRes, refRes] = await Promise.all([
        getJson("/v1/subscriptions/plans") as Promise<{ data: SubPlan[] }>,
        getJson(`/v1/entitlements?userId=${DEMO_USER_ID}`) as Promise<{
          data: Entitlement;
        }>,
        getJson(`/v1/referrals?userId=${DEMO_USER_ID}`) as Promise<{
          data: ReferralInfo;
        }>,
      ]);
      setSubPlans(plansRes.data);
      setEntitlement(entRes.data);
      setReferral(refRes.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  async function subscribe(planId: number) {
    setError(null);
    try {
      const data = (await postJson("/v1/subscriptions/checkout", {
        userId: DEMO_USER_ID,
        planId,
      })) as { txRef: string; paymentUrl?: string | null };
      if (data.paymentUrl) {
        setPendingTx(data.txRef);
        await WebBrowser.openBrowserAsync(data.paymentUrl);
      }
      const ent = (await getJson(
        `/v1/entitlements?userId=${DEMO_USER_ID}`,
      )) as {
        data: Entitlement;
      };
      setEntitlement(ent.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Subscribe failed");
    }
  }

  async function ensureReferralCode() {
    setError(null);
    try {
      await postJson("/v1/referrals", { userId: DEMO_USER_ID });
      const ref = (await getJson(`/v1/referrals?userId=${DEMO_USER_ID}`)) as {
        data: ReferralInfo;
      };
      setReferral(ref.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Referral failed");
    }
  }

  async function redeemReferral() {
    setError(null);
    setRedeemMsg(null);
    try {
      await postJson("/v1/referrals/redeem", {
        code: redeemInput.trim(),
        userId: DEMO_USER_ID,
      });
      setRedeemMsg("Code redeemed ✓ — thanks for spreading recovery");
      setRedeemInput("");
    } catch (e) {
      setRedeemMsg(e instanceof Error ? e.message : "Redeem failed");
    }
  }

  async function togglePromos() {
    setError(null);
    try {
      await putJson(`/v1/users/${DEMO_USER_ID}/prefs`, { promos: !promos });
      setPromos(!promos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function toggleReminders() {
    setError(null);
    try {
      const data = (await putJson(`/v1/users/${DEMO_USER_ID}/prefs`, {
        reminders: !reminders,
      })) as { reminders: boolean };
      setReminders(data.reminders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function saveReminderTime() {
    setError(null);
    try {
      const data = (await putJson(`/v1/users/${DEMO_USER_ID}/prefs`, {
        reminderTime,
      })) as { reminderTime: string };
      setReminderTime(data.reminderTime);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function loadPrefs() {
    try {
      const data = (await getJson(`/v1/users/${DEMO_USER_ID}/prefs`)) as {
        promos: boolean;
        reminders: boolean;
        reminderTime: string;
      };
      setPromos(data.promos);
      setReminders(data.reminders);
      setReminderTime(data.reminderTime);
    } catch {
      // defaults stand
    }
  }

  async function sendChat() {
    const message = chatInput.trim();
    if (!message || chatBusy) return;
    setChatInput("");
    const next = [...chat, { role: "user" as const, content: message }];
    setChat(next);
    setChatBusy(true);
    setError(null);
    try {
      const data = (await postJson("/v1/coach/chat", {
        userId: DEMO_USER_ID,
        message,
        history: next.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      })) as {
        reply: string;
        flagged: boolean;
        sources: { title: string; source: string }[];
      };
      setChat([
        ...next,
        { role: "assistant", content: data.reply, sources: data.sources },
      ]);
    } catch (e) {
      setChat([
        ...next,
        {
          role: "assistant",
          content: "Coach is unreachable right now — try again in a bit.",
        },
      ]);
      setError(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setChatBusy(false);
    }
  }

  useEffect(() => {
    void refreshPending();
  }, []);

  useEffect(() => {
    if (
      screen === "learn" &&
      (learnItems === null || related === null) &&
      !busy
    ) {
      void loadLearnScreen(learnTab);
    }
  }, [screen]);

  useEffect(() => {
    if (
      screen === "shop" &&
      (shopRecs === null || shopOrders === null) &&
      !busy
    ) {
      void loadShopScreen();
    }
  }, [screen]);

  useEffect(() => {
    if (!timerOn || selectedProgram === null) return;
    if (secondsLeft <= 0) {
      if (stepIdx >= selectedProgram.steps.length - 1) {
        setTimerOn(false);
        setFinished(true);
      } else {
        const next = stepIdx + 1;
        setStepIdx(next);
        setSecondsLeft(selectedProgram.steps[next].seconds);
      }
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timerOn, secondsLeft, stepIdx, selectedProgram]);

  const STEP_TITLES: Record<Screen, string> = {
    splash: "Welcome",
    welcome: "Welcome",
    about: "About you",
    owned: "Your gear",
    profile: "Step 4 · Profile",
    assessment: "Step 5 · Assessment",
    plan: "Step 6 · Your plan",
    home: "Home · Daily check-in",
    recover: "Recover · Programs",
    program: "Recover · Guided session",
    feedback: "Session feedback",
    done: "Well done",
    learn: "Learn · Library",
    learnDetail: "Learn · Detail",
    shop: "Shop · Problem-first",
    product: "Shop · Product",
    progress: "Progress · Trends",
    account: "Profile · Goals & orders",
    wishlist: "Wishlist",
    support: "Support",
    notifications: "Notifications",
    coach: "AI Coach",
  };

  const tabGo = (s: Screen) => {
    setError(null);
    setScreen(s);
  };

  function signOut() {
    setDrawerOpen(false);
    setHome(null);
    setPlan(null);
    setPrograms(null);
    setSelectedProgram(null);
    setScreen("splash");
  }

  return (
    <AppErrorBoundary>
      {fontsLoaded ? (
        <View style={styles.shell}>
          <ScrollView
            contentContainerStyle={styles.page}
            style={styles.scroller}
          >
            <Text style={styles.title}>Vyn Therapy</Text>
            <Text style={styles.step}>{STEP_TITLES[screen]}</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {screen === "splash" && (
              <View style={styles.splashWrap}>
                <Logo size={112} />
                <Text style={styles.splashTitle}>Vyn Therapy</Text>
                <Text style={styles.splashTag}>
                  Your daily recovery companion
                </Text>
                <View style={styles.splashLoader}>
                  <View style={styles.splashLoaderFill} />
                </View>
              </View>
            )}

            {screen === "welcome" && (
              <View>
                <Text style={styles.label}>Recover smarter, every day</Text>
                <Text style={styles.cardSub}>
                  Personalized plans, guided sessions and curated products for
                  desk-based bodies — in 5 to 15 minutes a day.
                </Text>
                <Pressable
                  style={styles.primary}
                  onPress={() => {
                    void loadOwnedOptions();
                    setScreen("about");
                  }}
                >
                  <Text style={styles.primaryText}>Create account</Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("profile")}
                >
                  <Text style={styles.secondaryText}>
                    I have an account — skip
                  </Text>
                </Pressable>
              </View>
            )}

            {screen === "about" && (
              <View>
                <OnboardingProgress step={1} total={4} />
                <Text style={styles.label}>Professional context</Text>
                <TextInput
                  style={styles.input}
                  value={occupation}
                  onChangeText={setOccupation}
                  placeholder="e.g. Software developer"
                  placeholderTextColor={colors.ink[500]}
                />
                <Text style={styles.label}>Activity level</Text>
                <View style={styles.chips}>
                  {ACTIVITY_LEVELS.map((a) => (
                    <Chip
                      key={a}
                      label={a}
                      selected={activityLevel === a}
                      onToggle={() => setActivityLevel(a)}
                    />
                  ))}
                </View>
                <Pressable
                  style={styles.primary}
                  onPress={() => setScreen("owned")}
                >
                  <Text style={styles.primaryText}>Continue</Text>
                </Pressable>
              </View>
            )}

            {screen === "owned" && (
              <View>
                <OnboardingProgress step={3} total={4} />
                <Text style={styles.label}>Hardware pairing</Text>
                <Text style={styles.cardSub}>
                  Scan your Vyn gear QR to unlock guides &amp; paired protocols
                  — or pick what you own below.
                </Text>
                <Text style={styles.cardSub}>
                  We will tailor routines to your gear.
                </Text>
                <View style={styles.chips}>
                  {ownedOptions.map((sku) => (
                    <Chip
                      key={sku}
                      label={sku}
                      selected={productsOwned.includes(sku)}
                      onToggle={() =>
                        setProductsOwned(
                          productsOwned.includes(sku)
                            ? productsOwned.filter((x) => x !== sku)
                            : [...productsOwned, sku],
                        )
                      }
                    />
                  ))}
                </View>
                <Pressable
                  style={styles.primary}
                  onPress={() => setScreen("profile")}
                >
                  <Text style={styles.primaryText}>
                    Generate recovery profile
                  </Text>
                </Pressable>
              </View>
            )}

            {screen === "profile" && (
              <View>
                <OnboardingProgress step={2} total={4} />
                <Text style={styles.label}>Symptom mapping</Text>
                <Text style={styles.cardSub}>
                  Where do you feel strain? Pick all that apply.
                </Text>
                <Text style={styles.label}>Goals</Text>
                <View style={styles.chips}>
                  {GOAL_OPTIONS.map((g) => (
                    <Chip
                      key={g}
                      label={g}
                      selected={goals.includes(g)}
                      onToggle={() => toggle(goals, g, setGoals)}
                    />
                  ))}
                </View>
                <Text style={styles.label}>Pain areas</Text>
                <View style={styles.chips}>
                  {PAIN_OPTIONS.map((p) => (
                    <Chip
                      key={p}
                      label={p}
                      selected={painAreas.includes(p)}
                      onToggle={() => toggle(painAreas, p, setPainAreas)}
                    />
                  ))}
                </View>
                <NumberRow
                  label="Minutes per session"
                  value={minutes}
                  min={5}
                  max={120}
                  onChange={setMinutes}
                />
                <NumberRow
                  label="Days per week"
                  value={days}
                  min={1}
                  max={7}
                  onChange={setDays}
                />
                <Pressable
                  style={styles.primary}
                  onPress={saveProfile}
                  disabled={busy}
                >
                  <Text style={styles.primaryText}>
                    {busy ? "Saving…" : "Continue"}
                  </Text>
                </Pressable>
              </View>
            )}

            {screen === "assessment" && (
              <View>
                <NumberRow
                  label="Soreness (1–5)"
                  value={soreness}
                  min={1}
                  max={5}
                  onChange={setSoreness}
                />
                <Text style={styles.label}>Sleep hours</Text>
                <TextInput
                  style={styles.input}
                  value={sleep}
                  onChangeText={setSleep}
                  keyboardType="numeric"
                  placeholder="e.g. 7"
                  placeholderTextColor={colors.ink[500]}
                />
                <NumberRow
                  label="Stress (1–5)"
                  value={stress}
                  min={1}
                  max={5}
                  onChange={setStress}
                />
                <Pressable
                  style={styles.primary}
                  onPress={saveAssessment}
                  disabled={busy}
                >
                  <Text style={styles.primaryText}>
                    {busy ? "Building plan…" : "Generate my plan"}
                  </Text>
                </Pressable>
              </View>
            )}

            {screen === "plan" && plan && (
              <View>
                {plan.items.map((item) => (
                  <View key={item.day} style={styles.card}>
                    <Text style={styles.cardDay}>{item.day}</Text>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSub}>
                      {item.durationMin} min · {item.slug}
                    </Text>
                  </View>
                ))}
                <Text style={styles.rationale}>{plan.rationale}</Text>
                {explanation ? (
                  <View style={styles.card}>
                    <Text style={styles.cardDay}>Why this plan</Text>
                    <Text style={styles.cardSub}>{explanation.summary}</Text>
                    {explanation.reasons.map((r) => (
                      <Text key={r} style={styles.cardSub}>
                        • {r}
                      </Text>
                    ))}
                    {explanation.sources.map((s) => (
                      <Text key={s.title} style={styles.cardSub}>
                        📖 {s.title} ({s.source})
                      </Text>
                    ))}
                    <Text style={styles.cardSub}>{explanation.disclaimer}</Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.secondary}
                    onPress={() => {
                      void loadExplanation(plan.id);
                    }}
                  >
                    <Text style={styles.secondaryText}>Why this plan?</Text>
                  </Pressable>
                )}
                <Pressable
                  style={styles.primary}
                  onPress={openHome}
                  disabled={busy}
                >
                  <Text style={styles.primaryText}>
                    {busy ? "Loading…" : "Open Home"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("profile")}
                >
                  <Text style={styles.secondaryText}>Start over</Text>
                </Pressable>
              </View>
            )}

            {screen === "home" && (
              <View>
                <AppHeader
                  title={`Good day${home?.score ? ` · ${home.score.score}` : ""}`}
                  onMenu={() => setDrawerOpen(true)}
                  onBell={() => setScreen("notifications")}
                  unread={(notifyList ?? []).filter((n) => !n.read).length}
                />
                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("coach")}
                >
                  <Text style={styles.secondaryText}>🤖 Ask AI Coach</Text>
                </Pressable>
                <View style={styles.homeTop}>
                  <ScoreRing value={home?.score?.score ?? 0} size={120} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <StreakPill count={home?.streak.count ?? 0} />
                    <StreakDots
                      days={7}
                      active={Math.min(7, home?.streak.count ?? 0)}
                    />
                    <Text style={styles.cardSub}>
                      {home
                        ? `${home.weekday} ${home.date}${home.checkIn ? " · checked in" : " · not checked in yet"}`
                        : "Loading…"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.label}>Today&apos;s session</Text>
                {home?.todaySession ? (
                  <RoutineHeroCard
                    title={home.todaySession.title}
                    meta={`${home.todaySession.day} · ${home.todaySession.durationMin} min · ${home.todaySession.slug}`}
                    cta="Start session"
                    onCta={() => {
                      const slug = home.todaySession?.slug;
                      if (slug) void openProgram(slug);
                    }}
                  />
                ) : (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Rest day</Text>
                    <Text style={styles.cardSub}>
                      No session planned — light movement only.
                    </Text>
                  </View>
                )}

                <Text style={styles.label}>How does your body feel today?</Text>
                <View style={styles.moodRow}>
                  {MOODS.map((m) => (
                    <Pressable
                      key={m.value}
                      style={[
                        styles.mood,
                        soreness === m.value && styles.moodSelected,
                      ]}
                      onPress={() => setSoreness(m.value)}
                    >
                      <Text style={styles.moodEmoji}>{m.emoji}</Text>
                      <Text style={styles.moodLabel}>{m.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.label}>Sleep hours</Text>
                <TextInput
                  style={styles.input}
                  value={sleep}
                  onChangeText={setSleep}
                  keyboardType="numeric"
                  placeholder="e.g. 7"
                  placeholderTextColor={colors.ink[500]}
                />
                <NumberRow
                  label="Stress (1–5)"
                  value={stress}
                  min={1}
                  max={5}
                  onChange={setStress}
                />
                <Pressable
                  style={styles.primary}
                  onPress={submitCheckIn}
                  disabled={busy}
                >
                  <Text style={styles.primaryText}>
                    {busy ? "Saving…" : "Submit check-in"}
                  </Text>
                </Pressable>

                <Text style={styles.label}>Today&apos;s recovery plan</Text>
                {(weekPlan ?? []).map((item) => {
                  const done = history.some(
                    (h) => h.programId === item.programId,
                  );
                  return (
                    <View key={item.day} style={styles.checklistRow}>
                      <View style={[styles.checkDot, done && styles.checkDone]}>
                        {done ? <Text style={styles.checkText}>✓</Text> : null}
                      </View>
                      <Text style={styles.checklistText}>
                        {item.day} · {item.title} ({item.durationMin} min)
                      </Text>
                    </View>
                  );
                })}

                {home?.todaySession ? (
                  <Pressable
                    style={styles.primary}
                    onPress={() => {
                      void openProgram(home.todaySession!.slug);
                    }}
                  >
                    <Text style={styles.primaryText}>
                      Continue · {home.todaySession.title}
                    </Text>
                  </Pressable>
                ) : null}

                {tip ? (
                  <View style={styles.card}>
                    <Text style={styles.cardDay}>Daily tip · {tip.source}</Text>
                    <Text style={styles.cardTitle}>{tip.title}</Text>
                    <Text style={styles.cardSub}>{tip.body}</Text>
                  </View>
                ) : null}

                {homeRecs && homeRecs.length > 0 ? (
                  <View style={styles.card}>
                    <Text style={styles.cardDay}>
                      Today&apos;s routine works even better with
                    </Text>
                    <Text style={styles.cardTitle}>{homeRecs[0].title}</Text>
                    <Pressable
                      onPress={() => {
                        void openProduct(homeRecs[0].sku);
                      }}
                    >
                      <Text style={styles.bookmark}>View product →</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            )}

            {screen === "recover" && (
              <View>
                {pendingCount > 0 ? (
                  <Text style={styles.pendingBanner}>
                    {pendingCount} session(s) saved offline — will sync
                  </Text>
                ) : null}
                {busy && programs === null ? (
                  <Text style={styles.cardSub}>Loading…</Text>
                ) : null}
                <Text style={styles.label}>Recovery library</Text>
                <View style={styles.chips}>
                  <Chip
                    label="All"
                    selected={recoverTag === null}
                    onToggle={() => setRecoverTag(null)}
                  />
                  {[
                    "neck",
                    "shoulders",
                    "back",
                    "lower-back",
                    "posture",
                    "sitting",
                    "legs",
                    "sleep",
                  ].map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      selected={recoverTag === t}
                      onToggle={() => setRecoverTag(t)}
                    />
                  ))}
                </View>
                {(programs ?? [])
                  .filter(
                    (p) => !recoverTag || p.problemTags.includes(recoverTag),
                  )
                  .map((p) => (
                    <Pressable
                      key={p.slug}
                      style={styles.card}
                      onPress={() => {
                        void openProgram(p.slug);
                      }}
                    >
                      <Text style={styles.cardDay}>
                        {p.level} · {p.duration_min} min
                      </Text>
                      <Text style={styles.cardTitle}>{p.title}</Text>
                      <Text style={styles.cardSub}>{p.description}</Text>
                    </Pressable>
                  ))}
                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("home")}
                >
                  <Text style={styles.secondaryText}>Back to Home</Text>
                </Pressable>
              </View>
            )}

            {screen === "program" && selectedProgram && (
              <View>
                <Text style={styles.label}>{selectedProgram.title}</Text>
                <Text style={styles.cardSub}>
                  {selectedProgram.description}
                </Text>
                {selectedProgram.steps.map((s, i) => (
                  <View
                    key={s.name}
                    style={[styles.card, i === stepIdx && styles.cardActive]}
                  >
                    <Text style={styles.cardDay}>
                      Step {i + 1} of {selectedProgram.steps.length}
                    </Text>
                    <Text style={styles.cardTitle}>{s.name}</Text>
                    <Text style={styles.cardSub}>
                      {i === stepIdx ? `${secondsLeft}s left` : `${s.seconds}s`}
                    </Text>
                  </View>
                ))}
                {doneMsg ? <Text style={styles.doneMsg}>{doneMsg}</Text> : null}
                <View style={styles.btnRow}>
                  <Pressable
                    style={styles.primary}
                    onPress={() => setTimerOn(!timerOn)}
                  >
                    <Text style={styles.primaryText}>
                      {timerOn ? "Pause" : "Start / Resume"}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.secondary} onPress={skipStep}>
                    <Text style={styles.secondaryText}>Skip step</Text>
                  </Pressable>
                </View>
                <Text style={styles.cardSub}>
                  Equipment:{" "}
                  {selectedProgram.equipment.length > 0
                    ? selectedProgram.equipment.join(", ")
                    : "Bodyweight only"}
                </Text>
                <Text style={styles.cardSub}>
                  Safety: move gently, never push into sharp pain. Stop and rest
                  if you feel dizzy or numb.
                </Text>
                <Pressable
                  style={[styles.primary, !finished && { opacity: 0.45 }]}
                  disabled={!finished || busy}
                  onPress={() => setScreen("feedback")}
                >
                  <Text style={styles.primaryText}>Finish</Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={() => {
                    setTimerOn(false);
                    setScreen("recover");
                  }}
                >
                  <Text style={styles.secondaryText}>All programs</Text>
                </Pressable>
              </View>
            )}

            {screen === "feedback" && (
              <View>
                <Text style={styles.label}>How did that feel?</Text>
                <View style={styles.moodRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Pressable
                      key={s}
                      style={[styles.mood, rating === s && styles.moodSelected]}
                      onPress={() => setRating(s)}
                    >
                      <Text style={styles.moodEmoji}>{"★".repeat(1)}</Text>
                      <Text style={styles.moodLabel}>{s}/5</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={[styles.input, { minHeight: 80 }]}
                  value={feedback}
                  onChangeText={setFeedback}
                  placeholder="Anything to note? (optional)"
                  placeholderTextColor={colors.ink[500]}
                  multiline
                />
                <Pressable
                  style={styles.primary}
                  onPress={() => {
                    void completeSession();
                  }}
                  disabled={busy}
                >
                  <Text style={styles.primaryText}>
                    {busy ? "Saving…" : "Submit feedback"}
                  </Text>
                </Pressable>
              </View>
            )}

            {screen === "done" && (
              <View style={styles.centerWrap}>
                <Text style={styles.splashLogo}>🎉</Text>
                <Text style={styles.label}>Great job!</Text>
                <Text style={styles.cardSub}>
                  Today&apos;s recovery is complete.
                </Text>
                {doneMsg ? <Text style={styles.doneMsg}>{doneMsg}</Text> : null}
                {lastGain !== null ? (
                  <Text style={styles.streakFlame}>
                    Recovery Score {lastGain >= 0 ? `+${lastGain}` : lastGain}
                  </Text>
                ) : null}
                {home ? (
                  <Text style={styles.cardSub}>
                    🔥 {home.streak.count}-day streak
                  </Text>
                ) : null}
                <Pressable
                  style={styles.primary}
                  onPress={() => setScreen("home")}
                >
                  <Text style={styles.primaryText}>Back to Home</Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("progress")}
                >
                  <Text style={styles.secondaryText}>Track progress</Text>
                </Pressable>
              </View>
            )}

            {screen === "learn" && (
              <View>
                <Text style={styles.label}>For you</Text>
                {(related ?? []).slice(0, 3).map((r) => (
                  <Pressable
                    key={`${r.kind}-${r.slug}`}
                    style={styles.card}
                    onPress={() => {
                      void openLearnDetail(r.kind, r.slug);
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
                      selected={learnCat === c}
                      onToggle={() => setLearnCat(c)}
                    />
                  ))}
                </View>
                <View style={styles.chips}>
                  <Chip
                    label="Articles"
                    selected={learnTab === "articles"}
                    onToggle={() => {
                      setLearnItems(null);
                      void loadLearnScreen("articles");
                    }}
                  />
                  <Chip
                    label="Videos"
                    selected={learnTab === "videos"}
                    onToggle={() => {
                      setLearnItems(null);
                      void loadLearnScreen("videos");
                    }}
                  />
                </View>
                {(learnItems ?? [])
                  .filter(
                    (item) =>
                      learnCat === "All" ||
                      item.category.toLowerCase() === learnCat.toLowerCase() ||
                      (learnCat === "Product Guides" && learnTab === "videos"),
                  )
                  .map((item) => (
                    <View key={item.slug} style={styles.card}>
                      <Pressable
                        onPress={() => {
                          void openLearnDetail(
                            learnTab === "articles" ? "article" : "video",
                            item.slug,
                          );
                        }}
                      >
                        <Text style={styles.cardDay}>{item.category}</Text>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardSub}>{item.sub}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          void toggleBookmark(
                            learnTab === "articles" ? "article" : "video",
                            item.id,
                          );
                        }}
                      >
                        <Text style={styles.bookmark}>
                          {isBookmarked(
                            learnTab === "articles" ? "article" : "video",
                            item.id,
                          )
                            ? "★ Saved"
                            : "☆ Save"}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("home")}
                >
                  <Text style={styles.secondaryText}>Back to Home</Text>
                </Pressable>
              </View>
            )}

            {screen === "learnDetail" && learnDetail && (
              <View>
                <Text style={styles.cardDay}>{learnDetail.category}</Text>
                <Text style={styles.label}>{learnDetail.title}</Text>
                {learnDetail.kind === "article" ? (
                  <Text style={styles.cardSub}>
                    {learnDetail.body || learnDetail.excerpt}
                  </Text>
                ) : (
                  <Text style={styles.cardSub}>
                    {learnDetail.playbackUrl ??
                      "Video coming soon — media library in progress."}
                  </Text>
                )}
                <Pressable
                  onPress={() => {
                    void toggleBookmark(learnDetail.kind, learnDetail.id);
                  }}
                >
                  <Text style={styles.bookmark}>
                    {isBookmarked(learnDetail.kind, learnDetail.id)
                      ? "★ Saved"
                      : "☆ Save"}
                  </Text>
                </Pressable>
                {learnRelProgs.length > 0 ? (
                  <View>
                    <Text style={styles.label}>Related programs</Text>
                    {learnRelProgs.map((p) => (
                      <Pressable
                        key={p.slug}
                        style={styles.card}
                        onPress={() => {
                          void openProgram(p.slug);
                        }}
                      >
                        <Text style={styles.cardTitle}>{p.title}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {learnRelProds.length > 0 ? (
                  <View>
                    <Text style={styles.label}>Related products</Text>
                    {learnRelProds.map((p) => (
                      <Pressable
                        key={p.sku}
                        style={styles.card}
                        onPress={() => {
                          void openProduct(p.sku);
                        }}
                      >
                        <Text style={styles.cardTitle}>{p.title}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("learn")}
                >
                  <Text style={styles.secondaryText}>Back to Learn</Text>
                </Pressable>
              </View>
            )}

            {screen === "shop" && (
              <View>
                <Text style={styles.label}>I&apos;m having…</Text>
                <View style={styles.chips}>
                  <Chip
                    label="For me"
                    selected={shopProblem === null}
                    onToggle={() => {
                      void loadShopScreen();
                      setShopProblem(null);
                    }}
                  />
                  {PROBLEM_CHIPS.map((p) => (
                    <Chip
                      key={p.tag}
                      label={p.label}
                      selected={shopProblem === p.tag}
                      onToggle={() => {
                        void loadShopProblem(p.tag);
                      }}
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
                      onToggle={() => {
                        void loadShopProblem(c.tag);
                      }}
                    />
                  ))}
                </View>
                <Text style={styles.label}>Recommended for you</Text>
                {(shopRecs ?? []).map((r) => (
                  <Pressable
                    key={r.sku}
                    onPress={() => {
                      void openProduct(r.sku);
                    }}
                  >
                    <View style={styles.card}>
                      <Text style={styles.cardDay}>
                        {r.isBundle ? "Bundle" : "Product"}
                        {r.matchedTags.length > 0
                          ? ` · for ${r.matchedTags.join(", ")}`
                          : ""}
                      </Text>
                      <Text style={styles.cardTitle}>{r.title}</Text>
                      <Text style={styles.cardSub}>
                        {r.currency === "NGN" ? "₦" : `${r.currency} `}
                        {(r.amountMinor / 100).toLocaleString()}
                        {r.isBundle && r.members.length > 0
                          ? ` · ${r.members.length} items`
                          : ""}
                      </Text>
                    </View>
                  </Pressable>
                ))}
                {buyMsg ? <Text style={styles.doneMsg}>{buyMsg}</Text> : null}
                {pendingTx ? (
                  <Pressable
                    style={styles.primary}
                    onPress={() => {
                      void checkPayment(pendingTx);
                    }}
                  >
                    <Text style={styles.primaryText}>
                      I&apos;ve paid — check status
                    </Text>
                  </Pressable>
                ) : null}

                <Text style={styles.label}>My orders</Text>
                {(shopOrders ?? []).map((o) => (
                  <View key={o.id} style={styles.card}>
                    <Text style={styles.cardDay}>
                      #{o.id} · {o.status} · pay {o.paymentStatus ?? "?"} · ship{" "}
                      {o.fulfillmentStatus ?? "—"}
                    </Text>
                    <Text style={styles.cardTitle}>
                      {o.currency === "NGN" ? "₦" : `${o.currency} `}
                      {(o.amountMinor / 100).toLocaleString()}
                    </Text>
                    <Text style={styles.cardSub}>
                      {o.items.map((i) => `${i.title} ×${i.qty}`).join(" · ")}
                    </Text>
                    {o.txRef ? (
                      <Text style={styles.cardSub}>{o.txRef}</Text>
                    ) : null}
                  </View>
                ))}

                <Text style={styles.label}>QR code</Text>
                <Pressable
                  style={styles.secondary}
                  onPress={() => setQrOpen(true)}
                >
                  <Text style={styles.secondaryText}>▣ Scan hardware QR</Text>
                </Pressable>
                <TextInput
                  style={styles.input}
                  value={qrInput}
                  onChangeText={setQrInput}
                  placeholder="Or enter manually: VYN1-XXXXXXXXXXXX"
                  placeholderTextColor={colors.ink[500]}
                />
                <Pressable
                  style={styles.primary}
                  onPress={() => {
                    void submitQr();
                  }}
                >
                  <Text style={styles.primaryText}>Resolve</Text>
                </Pressable>
                {qrResult ? (
                  <Text style={styles.doneMsg}>{qrResult}</Text>
                ) : null}

                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("home")}
                >
                  <Text style={styles.secondaryText}>Back to Home</Text>
                </Pressable>
              </View>
            )}

            {screen === "product" && product && (
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
                          void openLearnDetail(
                            g.kind as "article" | "video",
                            g.slug,
                          );
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
                          void openProgram(r.slug);
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
                          void openProduct(r.sku);
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
                <Pressable
                  style={styles.primary}
                  onPress={() => {
                    void (async () => {
                      await buy(product.sku);
                      setScreen("shop");
                    })();
                  }}
                  disabled={busy}
                >
                  <Text style={styles.primaryText}>{busy ? "…" : "Buy"}</Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("shop")}
                >
                  <Text style={styles.secondaryText}>Back to Shop</Text>
                </Pressable>
              </View>
            )}

            {screen === "wishlist" && (
              <View>
                <Text style={styles.label}>Saved products</Text>
                {wishlist.length === 0 ? (
                  <Text style={styles.cardSub}>
                    Nothing saved yet — tap ☆ on any product.
                  </Text>
                ) : null}
                {wishlist.map((w) => (
                  <Pressable
                    key={w.id}
                    style={styles.card}
                    onPress={() => {
                      void openProduct(w.slug ?? "");
                    }}
                  >
                    <Text style={styles.cardTitle}>{w.title ?? w.slug}</Text>
                  </Pressable>
                ))}
                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("shop")}
                >
                  <Text style={styles.secondaryText}>Back to Shop</Text>
                </Pressable>
              </View>
            )}

            {screen === "support" && (
              <View>
                <Text style={styles.label}>Contact support</Text>
                <TextInput
                  style={styles.input}
                  value={ticketSubject}
                  onChangeText={setTicketSubject}
                  placeholder="Subject"
                  placeholderTextColor={colors.ink[500]}
                />
                <TextInput
                  style={[styles.input, { minHeight: 80 }]}
                  value={ticketMessage}
                  onChangeText={setTicketMessage}
                  placeholder="How can we help?"
                  placeholderTextColor={colors.ink[500]}
                  multiline
                />
                <Pressable
                  style={styles.primary}
                  onPress={() => {
                    void submitTicket();
                  }}
                >
                  <Text style={styles.primaryText}>Send ticket</Text>
                </Pressable>
                <Text style={styles.label}>My tickets</Text>
                {tickets.map((t) => (
                  <View key={t.id} style={styles.card}>
                    <Text style={styles.cardDay}>{t.status}</Text>
                    <Text style={styles.cardTitle}>{t.subject}</Text>
                    {t.message ? (
                      <Text style={styles.cardSub}>{t.message}</Text>
                    ) : null}
                  </View>
                ))}
                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("account")}
                >
                  <Text style={styles.secondaryText}>Back to Profile</Text>
                </Pressable>
              </View>
            )}

            {screen === "notifications" && (
              <View>
                <Text style={styles.label}>Notifications</Text>
                {(notifyList ?? []).length === 0 ? (
                  <Text style={styles.cardSub}>All caught up.</Text>
                ) : null}
                {(notifyList ?? []).map((n) => (
                  <View key={n.id} style={styles.card}>
                    <Text style={styles.cardDay}>
                      {n.kind}
                      {n.read ? "" : " · new"}
                    </Text>
                    <Text style={styles.cardTitle}>{n.title}</Text>
                    {n.body ? (
                      <Text style={styles.cardSub}>{n.body}</Text>
                    ) : null}
                  </View>
                ))}
                {(notifyList ?? []).some((n) => !n.read) ? (
                  <Pressable
                    style={styles.secondary}
                    onPress={() => {
                      void markAllRead();
                    }}
                  >
                    <Text style={styles.secondaryText}>Mark all read</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("home")}
                >
                  <Text style={styles.secondaryText}>Back to Home</Text>
                </Pressable>
              </View>
            )}

            {screen === "coach" && (
              <View>
                <Text style={styles.cardSub}>
                  Grounded in your plan, scores and the Vyn knowledge base.
                </Text>
                {chat.length === 0 ? (
                  <Text style={styles.cardSub}>
                    Try: “What should I focus on today?”
                  </Text>
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
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Ask about recovery…"
                  placeholderTextColor={colors.ink[500]}
                  multiline
                />
                <Pressable
                  style={styles.primary}
                  onPress={() => {
                    void sendChat();
                  }}
                  disabled={chatBusy}
                >
                  <Text style={styles.primaryText}>
                    {chatBusy ? "Thinking…" : "Send"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("home")}
                >
                  <Text style={styles.secondaryText}>Back to Home</Text>
                </Pressable>
              </View>
            )}

            {screen === "progress" && (
              <View>
                <Text style={styles.label}>Score history</Text>
                {(progress?.scores ?? []).slice(-14).map((s) => (
                  <View key={s.date} style={styles.barRow}>
                    <Text style={styles.barLabel}>{s.date.slice(5)}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${s.score}%`,
                            backgroundColor: bandColor(scoreBandFor(s.score)),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barValue}>{s.score}</Text>
                  </View>
                ))}
                {progress && progress.scores.length === 0 ? (
                  <Text style={styles.cardSub}>
                    No scores yet — submit a check-in.
                  </Text>
                ) : null}

                <Text style={styles.label}>Milestones</Text>
                {(progress?.milestones ?? []).map((m) => (
                  <View key={m.kind} style={styles.card}>
                    <Text style={styles.cardTitle}>🏆 {m.label}</Text>
                    <Text style={styles.cardSub}>
                      {new Date(m.achievedAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
                {progress && progress.milestones.length === 0 ? (
                  <Text style={styles.cardSub}>
                    No milestones yet — keep going.
                  </Text>
                ) : null}

                <Text style={styles.label}>Level & XP</Text>
                {game ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                      Level {game.level} · {game.xp} XP ({game.xpToNext} to
                      next)
                    </Text>
                    <Text style={styles.cardSub}>
                      {game.badges
                        .filter((b) => b.earned)
                        .map((b) => `🏅 ${b.title}`)
                        .join(" · ") || "No badges yet"}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.secondary}
                    onPress={() => {
                      void loadGame();
                    }}
                  >
                    <Text style={styles.secondaryText}>Load gamification</Text>
                  </Pressable>
                )}
                <Text style={styles.label}>Challenges</Text>
                {(game?.challenges ?? []).map((c) => (
                  <View key={c.id} style={styles.card}>
                    <Text style={styles.cardTitle}>
                      {c.done ? "✓ " : ""}
                      {c.title}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.round((c.progress / c.target) * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.cardSub}>
                      {c.progress}/{c.target}
                    </Text>
                  </View>
                ))}

                <Text style={styles.label}>Recommended for you</Text>
                {(recs ?? []).map((r) => (
                  <Pressable
                    key={`${r.kind}-${r.title}`}
                    style={styles.card}
                    onPress={() => openRec(r)}
                  >
                    <Text style={styles.cardDay}>{r.kind}</Text>
                    <Text style={styles.cardTitle}>{r.title}</Text>
                    <Text style={styles.cardSub}>{r.reason}</Text>
                  </Pressable>
                ))}

                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("home")}
                >
                  <Text style={styles.secondaryText}>Back to Home</Text>
                </Pressable>
              </View>
            )}

            {screen === "account" && (
              <View>
                <Text style={styles.label}>Notifications</Text>
                {(notifications ?? []).slice(0, 5).map((n) => (
                  <View key={n.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{n.title}</Text>
                    <Text style={styles.cardSub}>{n.body}</Text>
                  </View>
                ))}
                {(notifications ?? []).some((n) => !n.read) ? (
                  <Pressable
                    style={styles.secondary}
                    onPress={() => {
                      void markAllRead();
                    }}
                  >
                    <Text style={styles.secondaryText}>Mark all read</Text>
                  </Pressable>
                ) : null}

                <Text style={styles.label}>Goals</Text>
                {(goalList ?? []).map((g) => (
                  <View key={g.id} style={styles.goalRow}>
                    <Pressable
                      style={[styles.checkbox, g.done && styles.checkboxDone]}
                      onPress={() => {
                        void toggleGoal(g);
                      }}
                    >
                      <Text style={styles.checkboxText}>
                        {g.done ? "✓" : ""}
                      </Text>
                    </Pressable>
                    <Text style={[styles.goalTitle, g.done && styles.goalDone]}>
                      {g.title}
                    </Text>
                    <Pressable
                      onPress={() => {
                        void removeGoal(g.id);
                      }}
                    >
                      <Text style={styles.goalDelete}>✕</Text>
                    </Pressable>
                  </View>
                ))}
                <TextInput
                  style={styles.input}
                  value={newGoal}
                  onChangeText={setNewGoal}
                  placeholder="New goal, e.g. Stretch twice a week"
                  placeholderTextColor={colors.ink[500]}
                />
                <Pressable
                  style={styles.primary}
                  onPress={() => {
                    void addGoal();
                  }}
                >
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
                          onPress={() => {
                            void subscribe(p.id);
                          }}
                        >
                          <Text style={styles.primaryText}>Subscribe</Text>
                        </Pressable>
                      </View>
                    ))}
                    {subPlans === null ? (
                      <Pressable
                        style={styles.secondary}
                        onPress={() => {
                          void loadAccountExtras();
                        }}
                      >
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
                    <Text style={styles.cardSub}>
                      Status: {referral.mine[0].status}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.secondary}
                    onPress={() => {
                      void ensureReferralCode();
                    }}
                  >
                    <Text style={styles.secondaryText}>
                      Get my referral code
                    </Text>
                  </Pressable>
                )}
                <TextInput
                  style={styles.input}
                  value={redeemInput}
                  onChangeText={setRedeemInput}
                  placeholder="Redeem a friend's code"
                  placeholderTextColor={colors.ink[500]}
                />
                <Pressable
                  style={styles.primary}
                  onPress={() => {
                    void redeemReferral();
                  }}
                >
                  <Text style={styles.primaryText}>Redeem</Text>
                </Pressable>
                {redeemMsg ? (
                  <Text style={styles.doneMsg}>{redeemMsg}</Text>
                ) : null}

                <Text style={styles.label}>Settings</Text>
                <Pressable
                  style={styles.secondary}
                  onPress={() => {
                    void togglePromos();
                  }}
                >
                  <Text style={styles.secondaryText}>
                    Promos:{" "}
                    {promos ? "ON (tap to mute)" : "OFF (tap to unmute)"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={() => {
                    void toggleReminders();
                  }}
                >
                  <Text style={styles.secondaryText}>
                    Reminders:{" "}
                    {reminders ? "ON (tap to mute)" : "OFF (tap to unmute)"}
                  </Text>
                </Pressable>
                <TextInput
                  style={styles.input}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  placeholder="Reminder time HH:MM"
                  placeholderTextColor={colors.ink[500]}
                />
                <Pressable
                  style={styles.secondary}
                  onPress={() => {
                    void saveReminderTime();
                  }}
                >
                  <Text style={styles.secondaryText}>Save reminder time</Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={() => {
                    if (confirmDelete) {
                      void deleteMyData();
                    } else {
                      setConfirmDelete(true);
                    }
                  }}
                >
                  <Text style={styles.secondaryText}>
                    {confirmDelete
                      ? "Tap again to erase my data"
                      : "Delete my data"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.secondary}
                  onPress={() => setScreen("home")}
                >
                  <Text style={styles.secondaryText}>Back to Home</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
          <TabBar screen={screen} onGo={tabGo} />
          <QrScannerModal
            visible={qrOpen}
            onClose={() => setQrOpen(false)}
            onSimulate={() => {
              setQrOpen(false);
              setQrInput("VYN1-DEMOQR1234");
            }}
          />
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onGo={tabGo}
            onSignOut={signOut}
          />
        </View>
      ) : null}
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 16,
    backgroundColor: colors.surface.base,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.brand[900],
    fontFamily,
  },
  step: {
    fontSize: 14,
    color: colors.ink[500],
    marginBottom: 16,
    fontFamily,
  },
  error: { color: colors.danger, marginBottom: 12, fontFamily },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 6,
    color: colors.ink[900],
    fontFamily,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.ink[300],
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  chipText: { color: colors.ink[700], fontWeight: "600", fontFamily },
  chipTextSelected: { color: "#fff" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand[100],
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    fontSize: 20,
    color: colors.brand[900],
    fontWeight: "700",
    fontFamily,
  },
  stepValue: {
    fontSize: 18,
    fontWeight: "700",
    minWidth: 32,
    textAlign: "center",
    fontFamily,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily,
    minHeight: 44,
  },
  primary: {
    backgroundColor: colors.brand[500],
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
    minHeight: 44,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    fontFamily,
  },
  secondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
    minHeight: 44,
  },
  secondaryText: {
    color: colors.brand[900],
    fontWeight: "700",
    fontSize: 16,
    fontFamily,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.ink[100],
  },
  cardDay: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.primary.onFixedVariant,
    fontFamily,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", marginTop: 2, fontFamily },
  cardSub: { fontSize: 14, color: colors.ink[500], marginTop: 2, fontFamily },
  rationale: {
    fontSize: 13,
    color: colors.ink[500],
    marginTop: 12,
    fontFamily,
  },
  homeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  scoreCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  scoreNum: { fontSize: 26, fontWeight: "800", color: colors.ink[900] },
  streakFlame: { fontSize: 18, fontWeight: "700" },
  cardActive: { borderColor: colors.brand[500], borderWidth: 2 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  pendingBanner: {
    backgroundColor: colors.accent[100],
    color: colors.accent[600],
    fontWeight: "700",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
  },
  doneMsg: { fontSize: 14, fontWeight: "700", marginTop: 12 },
  bookmark: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.brand[700],
    marginTop: 8,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  barLabel: { fontSize: 12, color: colors.ink[500], width: 44 },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surface.container,
    overflow: "hidden",
  },
  barFill: { height: 8, backgroundColor: colors.brand[500] },
  barValue: {
    fontSize: 13,
    fontWeight: "700",
    width: 28,
    textAlign: "right",
    fontFamily,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.ink[100],
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.brand[500],
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: colors.brand[500] },
  checkboxText: { color: "#fff", fontWeight: "700" },
  goalTitle: { flex: 1, fontSize: 15, fontWeight: "600" },
  goalDone: { textDecorationLine: "line-through", color: colors.ink[500] },
  goalDelete: { fontSize: 16, color: colors.danger, padding: 4 },
  shell: { flex: 1, backgroundColor: colors.surface.base },
  scroller: { flex: 1 },
  centerWrap: { alignItems: "center", paddingVertical: 60 },
  splashWrap: {
    alignItems: "center",
    paddingVertical: 60,
    backgroundColor: colors.brand[900],
    borderRadius: 24,
    paddingHorizontal: 24,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginTop: 16,
    fontFamily,
  },
  splashTag: {
    fontSize: 15,
    color: colors.brand[100],
    marginTop: 4,
    fontFamily,
  },
  splashLoader: {
    height: 4,
    width: 160,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: 24,
    overflow: "hidden",
  },
  splashLoaderFill: {
    height: "100%",
    width: "60%",
    backgroundColor: colors.brand[100],
    borderRadius: 999,
  },
  splashLogo: { fontSize: 64, fontWeight: "800", color: colors.brand[700] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    backgroundColor: "rgba(249, 249, 255, 0.9)",
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.container,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: { fontSize: 18 },
  headerTitle: { fontSize: 18, fontWeight: "800", fontFamily },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
    paddingTop: 6,
    paddingBottom: 16,
    minHeight: 64,
  },
  tab: { flex: 1, alignItems: "center", minHeight: 44 },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 11, color: colors.ink[500], fontFamily },
  tabActive: { color: colors.brand[500], fontWeight: "700" },
  drawerOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
  },
  drawerScrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  drawer: { width: 250, backgroundColor: "#fff", padding: 20 },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    fontFamily,
  },
  drawerItem: { paddingVertical: 12, minHeight: 44 },
  drawerText: { fontSize: 16, fontFamily },
  moodRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  mood: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: 8,
    paddingVertical: 8,
    minHeight: 44,
  },
  moodSelected: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[50],
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 11, color: colors.ink[700], fontFamily },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  checkDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.brand[500],
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { backgroundColor: colors.brand[500] },
  checkText: { color: "#fff", fontWeight: "700" },
  checklistText: { fontSize: 15, flex: 1 },
});
