import React, { useEffect, useState } from "react";
import "./global.css";
import { Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "./src/styles";
import { QrScannerModal } from "./components/RNUI";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { authClient } from "./src/auth-client";
import { NotificationsScreen } from "./src/screens/Notifications";
import { HomeScreen } from "./src/screens/Home";
import { RecoverScreen } from "./src/screens/Recover";
import { LearnDetailScreen, LearnScreen } from "./src/screens/Learn";
import { ShopScreen } from "./src/screens/Shop";
import { ProductScreen } from "./src/screens/Product";
import { CartScreen } from "./src/screens/Cart";
import { CheckoutScreen } from "./src/screens/Checkout";
import { WishlistScreen } from "./src/screens/Wishlist";
import { ProgressScreen } from "./src/screens/Progress";
import { SupportScreen } from "./src/screens/Support";
import { CoachScreen } from "./src/screens/Coach";
import { AccountScreen } from "./src/screens/Account";
import {
  DoneScreen,
  FeedbackScreen,
  ProgramScreen,
} from "./src/screens/Session";
import {
  AboutScreen,
  AssessmentScreen,
  OwnedScreen,
  PlanScreen,
  ProfileScreen,
  SplashScreen,
  WelcomeScreen,
} from "./src/screens/Onboarding";
import type {
  Bookmark,
  CartItem,
  ChatMsg,
  DailyTip,
  Entitlement,
  Explanation,
  GameState,
  Goal,
  HistoryItem,
  HomeData,
  LearnDetail,
  LearnItem,
  LearnListItem,
  NotificationItem,
  Plan,
  PlanItem,
  ProductDetail,
  Program,
  ProgressData,
  Rec,
  ReferralInfo,
  Screen,
  ShopOrder,
  ShopRec,
  SubPlan,
  Ticket,
  WishlistItem,
} from "./src/types";
import {
  CART_KEY,
  QUEUE_KEY,
  delJson,
  flushQueue,
  getJson,
  postJson,
  putJson,
  readQueue,
  todayStr,
  unwrap,
  unwrapArray,
} from "./src/api";

const TABS: { screen: Screen; label: string; icon: string }[] = [
  { screen: "home", label: "Home", icon: "⌂" },
  { screen: "recover", label: "Recover", icon: "◉" },
  { screen: "learn", label: "Learn", icon: "▶" },
  { screen: "shop", label: "Shop", icon: "◈" },
  { screen: "progress", label: "Progress", icon: "▲" },
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

export default function App() {
  // Fonts load async and swap in when ready — never gate rendering on them,
  // otherwise a stalled font fetch leaves a blank page with no error.
  useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const [screen, setScreen] = useState<Screen>("splash");
  const [busy, setBusy] = useState(false);
  const [appUserId, setAppUserId] = useState<number | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authMode, setAuthMode] = useState<"in" | "up">("up");
  const userId = appUserId ?? 0;
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shipName, setShipName] = useState("");
  const [shipPhone, setShipPhone] = useState("");
  const [shipAddress, setShipAddress] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shopProblem, setShopProblem] = useState<string | null>(null);

  async function loadShopProblem(tag: string | null) {
    setBusy(true);
    setError(null);
    try {
      const url =
        tag === null
          ? `/v1/shop/recommendations?userId=${userId}`
          : `/v1/shop/recommendations?problem=${encodeURIComponent(tag)}`;
      const data = (await getJson(url)) as unknown as
        ShopRec[] | { data?: ShopRec[] };
      setShopRecs(unwrapArray<ShopRec>(data));
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
    kind: "article" | "video" | "product" | "program",
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

  useEffect(() => {
    void restoreSession();
  }, []);

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
        userId: userId,
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
        userId: userId,
        soreness,
        sleepHours: Number(sleep) || 0,
        stress,
        activity: "",
        painAreas,
      });
      const generated = (await postJson("/v1/plans/generate", {
        userId: userId,
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
            `/v1/home?userId=${userId}&date=${todayStr()}`,
          ) as Promise<HomeData>,
          getJson("/v1/daily-tip") as Promise<DailyTip>,
          getJson(`/v1/sessions/history?userId=${userId}&limit=50`) as Promise<
            HistoryItem[]
          >,
          getJson(`/v1/plans/latest?userId=${userId}`).catch(
            () => null,
          ) as Promise<{ items: PlanItem[] } | null>,
          getJson(`/v1/notifications?userId=${userId}`) as Promise<{
            data: NotificationItem[];
          }>,
          getJson(`/v1/shop/recommendations?userId=${userId}`) as Promise<{
            data: ShopRec[];
          }>,
        ]);
      setHome(homeData);
      setTip(tipData);
      setHistory(historyData);
      setWeekPlan(planData?.items ?? null);
      setNotifyList(
        unwrapArray<NotificationItem>(
          notifyData as unknown as
            NotificationItem[] | { data?: NotificationItem[] },
        ),
      );
      setHomeRecs(
        unwrapArray<ShopRec>(
          recData as unknown as ShopRec[] | { data?: ShopRec[] },
        ),
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
        userId: userId,
        date: todayStr(),
        soreness,
        sleepHours: Number(sleep) || 0,
        stress,
        activity: "",
        timezone: "UTC",
      });
      const data = (await getJson(
        `/v1/home?userId=${userId}&date=${todayStr()}`,
      )) as HomeData;
      setHome(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function refreshPending() {
    setPendingCount((await readQueue()).length);
  }

  async function loadPrograms() {
    setBusy(true);
    setError(null);
    try {
      const data = (await getJson("/v1/programs?pageSize=50")) as unknown as
        Program[] | { data?: Program[] };
      setPrograms(unwrapArray<Program>(data));
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
      userId: userId,
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
          `/v1/home?userId=${userId}&date=${todayStr()}`,
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
      type LearnRow = {
        id: number;
        slug: string;
        title: string;
        excerpt?: string;
        description?: string;
        category: string;
      };
      const [itemsRes, relatedRes, bookmarkRes] = await Promise.all([
        getJson(`/v1/${tab}?pageSize=50`) as Promise<
          LearnRow[] | { data?: LearnRow[] }
        >,
        getJson(`/v1/learn/related?userId=${userId}`) as Promise<
          LearnItem[] | { data?: LearnItem[] }
        >,
        getJson(`/v1/bookmarks?userId=${userId}`) as Promise<
          Bookmark[] | { data?: Bookmark[] }
        >,
      ]);
      const rows = unwrapArray<LearnRow>(itemsRes);
      setLearnItems(
        rows.map((r) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          sub: r.excerpt ?? r.description ?? "",
          category: r.category,
        })),
      );
      setLearnTab(tab);
      setRelated(unwrapArray<LearnItem>(relatedRes));
      setBookmarks(unwrapArray<Bookmark>(bookmarkRes));
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
        getJson(`/v1/programs?tags=${tags.join(",")}&pageSize=3`) as Promise<
          | { slug: string; title: string }[]
          | { data?: { slug: string; title: string }[] }
        >,
        getJson("/v1/products?pageSize=50") as Promise<
          | { sku: string; title: string; problem_tags?: string[] }[]
          | { data?: { sku: string; title: string; problem_tags?: string[] }[] }
        >,
      ]);
      setLearnRelProgs(unwrapArray(progs));
      setLearnRelProds(
        unwrapArray(prods)
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
    kind: "article" | "video" | "product" | "program",
    refId: number,
  ) {
    setError(null);
    try {
      if (isBookmarked(kind, refId)) {
        await delJson("/v1/bookmarks", { userId: userId, kind, refId });
      } else {
        await postJson("/v1/bookmarks", { userId: userId, kind, refId });
      }
      const data = (await getJson(
        `/v1/bookmarks?userId=${userId}`,
      )) as unknown as Bookmark[] | { data?: Bookmark[] };
      setBookmarks(unwrapArray<Bookmark>(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bookmark failed");
    }
  }

  async function loadShopScreen() {
    setBusy(true);
    setError(null);
    try {
      const [recs, orders] = await Promise.all([
        getJson(`/v1/shop/recommendations?userId=${userId}`) as Promise<
          ShopRec[] | { data?: ShopRec[] }
        >,
        getJson(`/v1/shop/orders?userId=${userId}`) as Promise<
          ShopOrder[] | { data?: ShopOrder[] }
        >,
      ]);
      setShopRecs(unwrapArray<ShopRec>(recs));
      setShopOrders(unwrapArray<ShopOrder>(orders));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
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
          `/v1/shop/orders?userId=${userId}`,
        )) as unknown as ShopOrder[] | { data?: ShopOrder[] };
        setShopOrders(unwrapArray<ShopOrder>(orders));
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
      const [products, programs] = await Promise.all([
        getJson(`/v1/bookmarks?userId=${userId}&kind=product`) as Promise<
          WishlistItem[] | { data?: WishlistItem[] }
        >,
        getJson(`/v1/bookmarks?userId=${userId}&kind=program`) as Promise<
          WishlistItem[] | { data?: WishlistItem[] }
        >,
      ]);
      setWishlist([
        ...unwrapArray<WishlistItem>(products),
        ...unwrapArray<WishlistItem>(programs),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  async function persistCart(next: CartItem[]) {
    setCart(next);
    try {
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
    } catch {
      // in-memory cart still works
    }
  }

  async function loadCart() {
    try {
      const raw = await AsyncStorage.getItem(CART_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) setCart(parsed as CartItem[]);
    } catch {
      // start empty
    }
  }

  function addToCart(item: {
    sku: string;
    title: string;
    amountMinor: number;
    currency: string;
  }) {
    const existing = cart.find((c) => c.sku === item.sku);
    void persistCart(
      existing
        ? cart.map((c) => (c.sku === item.sku ? { ...c, qty: c.qty + 1 } : c))
        : [...cart, { ...item, qty: 1 }],
    );
  }

  function changeQty(sku: string, delta: number) {
    void persistCart(
      cart
        .map((c) => (c.sku === sku ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    );
  }

  function cartTotal(): number {
    return cart.reduce((sum, c) => sum + c.amountMinor * c.qty, 0);
  }

  async function checkout() {
    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setBusy(true);
    setError(null);
    setBuyMsg(null);
    try {
      const data = (await postJson("/v1/shop/checkout", {
        userId,
        items: cart.map((c) => ({ sku: c.sku, qty: c.qty })),
        shipping: {
          name: shipName,
          phone: shipPhone,
          address: shipAddress,
          city: shipCity,
        },
      })) as {
        order: { id: number };
        payment: { txRef: string; paymentUrl: string | null };
      };
      await persistCart([]);
      if (data.payment.paymentUrl) {
        setPendingTx(data.payment.txRef);
        setBuyMsg(`Order #${data.order.id} created — completing payment…`);
        await WebBrowser.openBrowserAsync(data.payment.paymentUrl);
        setBuyMsg(
          `Order #${data.order.id} — finish payment in the browser, then tap “Check status”.`,
        );
      } else {
        setBuyMsg(
          `Order #${data.order.id} created · test mode: no live payment link`,
        );
      }
      const orders = (await getJson(`/v1/shop/orders?userId=${userId}`)) as {
        data: ShopOrder[];
      };
      setShopOrders(orders.data);
      setScreen("shop");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadTickets() {
    setError(null);
    try {
      const data = (await getJson(
        `/v1/tickets?userId=${userId}`,
      )) as unknown as Ticket[] | { data?: Ticket[] };
      setTickets(unwrapArray<Ticket>(data));
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
        userId: userId,
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
        `/v1/notifications?userId=${userId}`,
      )) as unknown as NotificationItem[] | { data?: NotificationItem[] };
      setNotifyList(unwrapArray<NotificationItem>(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  async function loadGame() {
    try {
      const data = (await getJson(
        `/v1/gamification?userId=${userId}`,
      )) as unknown as GameState | { data?: GameState };
      setGame(unwrap<GameState | null>(data, null));
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
          getJson(`/v1/progress?userId=${userId}`) as Promise<
            ProgressData | { data?: ProgressData }
          >,
          getJson(`/v1/recommendations?userId=${userId}`) as Promise<
            Rec[] | { data?: Rec[] }
          >,
          getJson(`/v1/goals?userId=${userId}`) as Promise<
            Goal[] | { data?: Goal[] }
          >,
          getJson(`/v1/notifications?userId=${userId}`) as Promise<
            NotificationItem[] | { data?: NotificationItem[] }
          >,
          getJson(`/v1/shop/orders?userId=${userId}`) as Promise<
            ShopOrder[] | { data?: ShopOrder[] }
          >,
        ]);
      const prog = unwrap<ProgressData | null>(
        progressRes as ProgressData | { data?: ProgressData },
        null,
      );
      setProgress(prog);
      setRecs(unwrapArray<Rec>(recsRes));
      setGoalList(unwrapArray<Goal>(goalsRes));
      setNotifications(unwrapArray<NotificationItem>(notifRes));
      setShopOrders(unwrapArray<ShopOrder>(ordersRes));
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
      await postJson("/v1/goals", { userId: userId, title });
      setNewGoal("");
      const data = (await getJson(`/v1/goals?userId=${userId}`)) as unknown as
        Goal[] | { data?: Goal[] };
      setGoalList(unwrapArray<Goal>(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add failed");
    }
  }

  async function toggleGoal(goal: Goal) {
    setError(null);
    try {
      await putJson(`/v1/goals/${goal.id}`, {
        userId: userId,
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
      await delJson(`/v1/goals/${id}?userId=${userId}`, {});
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
      await postJson("/v1/notifications/read", { userId: userId });
      const data = (await getJson(
        `/v1/notifications?userId=${userId}`,
      )) as unknown as NotificationItem[] | { data?: NotificationItem[] };
      const items = unwrapArray<NotificationItem>(data);
      setNotifications(items);
      setNotifyList(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function deleteMyData() {
    setError(null);
    try {
      await delJson(`/v1/users/${userId}/data`, {});
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
      const [plansRes, entRes, refRes, profileRes] = await Promise.all([
        getJson("/v1/subscriptions/plans") as Promise<
          SubPlan[] | { data?: SubPlan[] }
        >,
        getJson(`/v1/entitlements?userId=${userId}`) as Promise<
          Entitlement | { data?: Entitlement }
        >,
        getJson(`/v1/referrals?userId=${userId}`) as Promise<
          ReferralInfo | { data?: ReferralInfo }
        >,
        getJson(`/v1/profiles/${userId}`).catch(() => null) as Promise<{
          productsOwned?: string[];
          occupation?: string;
        } | null>,
      ]);
      setSubPlans(unwrapArray<SubPlan>(plansRes));
      setEntitlement(
        unwrap<Entitlement | null>(
          entRes as Entitlement | { data?: Entitlement },
          null,
        ),
      );
      setReferral(
        unwrap<ReferralInfo | null>(
          refRes as ReferralInfo | { data?: ReferralInfo },
          null,
        ),
      );
      setProductsOwned(profileRes?.productsOwned ?? []);
      setOccupation(profileRes?.occupation ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }

  async function subscribe(planId: number) {
    setError(null);
    try {
      const data = (await postJson("/v1/subscriptions/checkout", {
        userId: userId,
        planId,
      })) as { txRef: string; paymentUrl?: string | null };
      if (data.paymentUrl) {
        setPendingTx(data.txRef);
        await WebBrowser.openBrowserAsync(data.paymentUrl);
      }
      const ent = (await getJson(
        `/v1/entitlements?userId=${userId}`,
      )) as unknown as Entitlement | { data?: Entitlement };
      setEntitlement(unwrap<Entitlement | null>(ent, null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Subscribe failed");
    }
  }

  async function ensureReferralCode() {
    setError(null);
    try {
      await postJson("/v1/referrals", { userId: userId });
      const ref = (await getJson(
        `/v1/referrals?userId=${userId}`,
      )) as unknown as ReferralInfo | { data?: ReferralInfo };
      setReferral(unwrap<ReferralInfo | null>(ref, null));
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
        userId: userId,
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
      await putJson(`/v1/users/${userId}/prefs`, { promos: !promos });
      setPromos(!promos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function toggleReminders() {
    setError(null);
    try {
      const data = (await putJson(`/v1/users/${userId}/prefs`, {
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
      const data = (await putJson(`/v1/users/${userId}/prefs`, {
        reminderTime,
      })) as { reminderTime: string };
      setReminderTime(data.reminderTime);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function loadPrefs() {
    try {
      const data = (await getJson(`/v1/users/${userId}/prefs`)) as {
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
        userId: userId,
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
    void loadCart();
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
    cart: "Cart",
    checkout: "Checkout",
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
    setAppUserId(null);
    setAuthPassword("");
    void authClient.signOut().catch(() => undefined);
    setScreen("welcome");
  }

  async function restoreSession() {
    try {
      const session = (await authClient.getSession()) as unknown as {
        data?: { user?: { email?: string; name?: string } } | null;
      };
      const email = session?.data?.user?.email;
      if (!email) return;
      const linked = (await postJson("/v1/auth/link", {
        email,
        name: session?.data?.user?.name ?? "",
      })) as { appUserId: number };
      setAppUserId(linked.appUserId);
    } catch {
      // stay signed out
    }
  }

  async function submitAuth() {
    const email = authEmail.trim().toLowerCase();
    if (!email || authPassword.length < 8) {
      setError("Enter an email and a password of 8+ characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (authMode === "up") {
        const res = await authClient.signUp.email({
          email,
          password: authPassword,
          name: authName.trim() || "Vyn User",
        });
        if (res.error) throw new Error(res.error.message ?? "Sign up failed");
      } else {
        const res = await authClient.signIn.email({
          email,
          password: authPassword,
        });
        if (res.error) throw new Error(res.error.message ?? "Sign in failed");
      }
      const linked = (await postJson("/v1/auth/link", {
        email,
        name: authName.trim(),
      })) as { appUserId: number };
      setAppUserId(linked.appUserId);
      setAuthPassword("");
      try {
        await getJson(`/v1/profiles/${linked.appUserId}`);
        setScreen("home");
      } catch {
        await loadOwnedOptions();
        setScreen("about");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppErrorBoundary>
      <View style={styles.shell}>
        <ScrollView contentContainerStyle={styles.page} style={styles.scroller}>
          <Text style={styles.title}>Vyn Therapy</Text>
          <Text style={styles.step}>{STEP_TITLES[screen]}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {screen === "splash" && <SplashScreen />}

          {screen === "welcome" && (
            <WelcomeScreen
              mode={authMode}
              name={authName}
              email={authEmail}
              password={authPassword}
              busy={busy}
              onMode={setAuthMode}
              onName={setAuthName}
              onEmail={setAuthEmail}
              onPassword={setAuthPassword}
              onSubmit={() => {
                void submitAuth();
              }}
            />
          )}

          {screen === "about" && (
            <AboutScreen
              occupation={occupation}
              activityLevel={activityLevel}
              onOccupation={setOccupation}
              onActivityLevel={setActivityLevel}
              onContinue={() => setScreen("owned")}
            />
          )}

          {screen === "owned" && (
            <OwnedScreen
              options={ownedOptions}
              owned={productsOwned}
              onToggle={(sku) =>
                setProductsOwned(
                  productsOwned.includes(sku)
                    ? productsOwned.filter((x) => x !== sku)
                    : [...productsOwned, sku],
                )
              }
              onContinue={() => setScreen("profile")}
            />
          )}

          {screen === "profile" && (
            <ProfileScreen
              goals={goals}
              painAreas={painAreas}
              minutes={minutes}
              days={days}
              busy={busy}
              onToggleGoal={(g) => toggle(goals, g, setGoals)}
              onTogglePain={(p) => toggle(painAreas, p, setPainAreas)}
              onMinutes={setMinutes}
              onDays={setDays}
              onContinue={() => {
                void saveProfile();
              }}
            />
          )}

          {screen === "assessment" && (
            <AssessmentScreen
              soreness={soreness}
              sleep={sleep}
              stress={stress}
              busy={busy}
              onSoreness={setSoreness}
              onSleep={setSleep}
              onStress={setStress}
              onSubmit={() => {
                void saveAssessment();
              }}
            />
          )}

          {screen === "plan" && plan && (
            <PlanScreen
              plan={plan}
              explanation={explanation}
              busy={busy}
              onExplain={() => {
                void loadExplanation(plan.id);
              }}
              onOpenHome={() => {
                void openHome();
              }}
              onStartOver={() => setScreen("profile")}
            />
          )}

          {screen === "home" && (
            <HomeScreen
              home={home}
              tip={tip}
              homeRecs={homeRecs}
              weekPlan={weekPlan}
              history={history}
              unread={(notifyList ?? []).filter((n) => !n.read).length}
              soreness={soreness}
              sleep={sleep}
              stress={stress}
              busy={busy}
              onMenu={() => setDrawerOpen(true)}
              onBell={() => setScreen("notifications")}
              onCoach={() => setScreen("coach")}
              onSoreness={setSoreness}
              onSleep={setSleep}
              onStress={setStress}
              onSubmitCheckIn={() => {
                void submitCheckIn();
              }}
              onStartSession={(slug) => {
                void openProgram(slug);
              }}
              onOpenProduct={(sku) => {
                void openProduct(sku);
              }}
            />
          )}

          {screen === "recover" && (
            <RecoverScreen
              programs={programs}
              activeTag={recoverTag}
              pendingCount={pendingCount}
              loading={busy}
              onSelectTag={setRecoverTag}
              onOpenProgram={(slug) => {
                void openProgram(slug);
              }}
              onBack={() => setScreen("home")}
            />
          )}

          {screen === "program" && selectedProgram && (
            <ProgramScreen
              program={selectedProgram}
              stepIdx={stepIdx}
              secondsLeft={secondsLeft}
              timerOn={timerOn}
              finished={finished}
              busy={busy}
              doneMsg={doneMsg}
              saved={isBookmarked("program", selectedProgram.id)}
              onToggleSave={() => {
                void toggleBookmark("program", selectedProgram.id);
              }}
              onToggleTimer={() => setTimerOn(!timerOn)}
              onSkipStep={skipStep}
              onFinish={() => setScreen("feedback")}
              onAllPrograms={() => {
                setTimerOn(false);
                setScreen("recover");
              }}
            />
          )}

          {screen === "feedback" && (
            <FeedbackScreen
              rating={rating}
              feedback={feedback}
              busy={busy}
              onRating={setRating}
              onFeedback={setFeedback}
              onSubmit={() => {
                void completeSession();
              }}
            />
          )}

          {screen === "done" && (
            <DoneScreen
              doneMsg={doneMsg}
              lastGain={lastGain}
              home={home}
              onHome={() => setScreen("home")}
              onProgress={() => setScreen("progress")}
            />
          )}

          {screen === "learn" && (
            <LearnScreen
              related={related}
              items={learnItems}
              category={learnCat}
              tab={learnTab}
              isBookmarked={isBookmarked}
              onOpenDetail={(kind, slug) => {
                void openLearnDetail(kind, slug);
              }}
              onSelectCategory={setLearnCat}
              onSelectTab={(t) => {
                setLearnItems(null);
                void loadLearnScreen(t);
              }}
              onToggleBookmark={(kind, id) => {
                void toggleBookmark(kind, id);
              }}
              onBack={() => setScreen("home")}
            />
          )}

          {screen === "learnDetail" && learnDetail && (
            <LearnDetailScreen
              detail={learnDetail}
              relProgs={learnRelProgs}
              relProds={learnRelProds}
              isBookmarked={isBookmarked}
              onToggleBookmark={(kind, id) => {
                void toggleBookmark(kind, id);
              }}
              onOpenProgram={(slug) => {
                void openProgram(slug);
              }}
              onOpenProduct={(sku) => {
                void openProduct(sku);
              }}
              onBack={() => setScreen("learn")}
            />
          )}

          {screen === "shop" && (
            <ShopScreen
              recs={shopRecs}
              orders={shopOrders}
              activeProblem={shopProblem}
              cartCount={cart.reduce((n, c) => n + c.qty, 0)}
              buyMsg={buyMsg}
              pendingTx={pendingTx}
              qrInput={qrInput}
              qrResult={qrResult}
              onForMe={() => {
                void loadShopScreen();
                setShopProblem(null);
              }}
              onProblemTag={(tag) => {
                void loadShopProblem(tag);
              }}
              onCollectionTag={(tag) => {
                void loadShopProblem(tag);
              }}
              onOpenCart={() => {
                void loadCart();
                setScreen("cart");
              }}
              onOpenProduct={(sku) => {
                void openProduct(sku);
              }}
              onAddToCart={(item) => addToCart(item)}
              onCheckPayment={() => {
                if (pendingTx) void checkPayment(pendingTx);
              }}
              onScanQr={() => setQrOpen(true)}
              onQrInput={setQrInput}
              onResolveQr={() => {
                void submitQr();
              }}
              onBack={() => setScreen("home")}
            />
          )}

          {screen === "product" && product && (
            <ProductScreen
              product={product}
              onOpenGuide={(kind, slug) => {
                void openLearnDetail(kind, slug);
              }}
              onOpenProgram={(slug) => {
                void openProgram(slug);
              }}
              onOpenProduct={(sku) => {
                void openProduct(sku);
              }}
              onAddToCart={() => {
                addToCart({
                  sku: product.sku,
                  title: product.title,
                  amountMinor: product.amountMinor,
                  currency: product.currency,
                });
                setScreen("cart");
              }}
              onBack={() => setScreen("shop")}
            />
          )}

          {screen === "wishlist" && (
            <WishlistScreen
              items={wishlist}
              onOpenProduct={(slug) => {
                void openProduct(slug);
              }}
              onOpenProgram={(slug) => {
                void openProgram(slug);
              }}
              onBack={() => setScreen("shop")}
            />
          )}

          {screen === "support" && (
            <SupportScreen
              subject={ticketSubject}
              message={ticketMessage}
              tickets={tickets}
              onSubject={setTicketSubject}
              onMessage={setTicketMessage}
              onSubmit={() => {
                void submitTicket();
              }}
              onBack={() => setScreen("account")}
            />
          )}

          {screen === "notifications" && (
            <NotificationsScreen
              items={notifyList ?? []}
              onMarkAllRead={() => {
                void markAllRead();
              }}
              onBack={() => setScreen("home")}
            />
          )}

          {screen === "coach" && (
            <CoachScreen
              chat={chat}
              input={chatInput}
              busy={chatBusy}
              onInput={setChatInput}
              onSend={() => {
                void sendChat();
              }}
              onBack={() => setScreen("home")}
            />
          )}

          {screen === "cart" && (
            <CartScreen
              cart={cart}
              totalMinor={cartTotal()}
              onChangeQty={(sku, delta) => changeQty(sku, delta)}
              onRemove={(sku) => changeQty(sku, -9999)}
              onCheckout={() => setScreen("checkout")}
              onBack={() => setScreen("shop")}
            />
          )}

          {screen === "checkout" && (
            <CheckoutScreen
              cart={cart}
              totalMinor={cartTotal()}
              shipping={{
                name: shipName,
                phone: shipPhone,
                address: shipAddress,
                city: shipCity,
              }}
              busy={busy}
              buyMsg={buyMsg}
              pendingTx={pendingTx}
              onShipping={(patch) => {
                if (patch.name !== undefined) setShipName(patch.name);
                if (patch.phone !== undefined) setShipPhone(patch.phone);
                if (patch.address !== undefined) setShipAddress(patch.address);
                if (patch.city !== undefined) setShipCity(patch.city);
              }}
              onPay={() => {
                void checkout();
              }}
              onCheckPayment={() => {
                if (pendingTx) void checkPayment(pendingTx);
              }}
              onBack={() => setScreen("cart")}
            />
          )}

          {screen === "progress" && (
            <ProgressScreen
              progress={progress}
              game={game}
              recs={recs}
              onLoadGame={() => {
                void loadGame();
              }}
              onOpenRec={openRec}
              onBack={() => setScreen("home")}
            />
          )}

          {screen === "account" && (
            <AccountScreen
              occupation={occupation}
              productsOwned={productsOwned}
              notifications={notifications}
              goalList={goalList}
              newGoal={newGoal}
              shopOrders={shopOrders}
              entitlement={entitlement}
              subPlans={subPlans}
              referral={referral}
              redeemInput={redeemInput}
              redeemMsg={redeemMsg}
              promos={promos}
              reminders={reminders}
              reminderTime={reminderTime}
              confirmDelete={confirmDelete}
              onMarkAllRead={() => {
                void markAllRead();
              }}
              onToggleGoal={(g) => {
                void toggleGoal(g);
              }}
              onRemoveGoal={(id) => {
                void removeGoal(id);
              }}
              onNewGoal={setNewGoal}
              onAddGoal={() => {
                void addGoal();
              }}
              onLoadPlans={() => {
                void loadAccountExtras();
              }}
              onSubscribe={(id) => {
                void subscribe(id);
              }}
              onEnsureReferral={() => {
                void ensureReferralCode();
              }}
              onRedeemInput={setRedeemInput}
              onRedeem={() => {
                void redeemReferral();
              }}
              onTogglePromos={() => {
                void togglePromos();
              }}
              onToggleReminders={() => {
                void toggleReminders();
              }}
              onReminderTime={setReminderTime}
              onSaveReminderTime={() => {
                void saveReminderTime();
              }}
              onDeleteData={() => {
                if (confirmDelete) {
                  void deleteMyData();
                } else {
                  setConfirmDelete(true);
                }
              }}
              onBack={() => setScreen("home")}
            />
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
    </AppErrorBoundary>
  );
}
