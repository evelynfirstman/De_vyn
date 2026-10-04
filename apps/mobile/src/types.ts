export type Screen =
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
  | "coach"
  | "cart"
  | "checkout";

export type PlanItem = {
  day: string;
  programId: number;
  slug: string;
  title: string;
  durationMin: number;
};

export type Plan = {
  id: number;
  items: PlanItem[];
  rationale: string;
};

export type HomeData = {
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

export type LearnItem = {
  kind: "article" | "video";
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  matchedTags: string[];
};

export type LearnListItem = {
  id: number;
  slug: string;
  title: string;
  sub: string;
  category: string;
};

export type LearnDetail =
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

export type Bookmark = {
  id: number;
  kind: "article" | "video" | "product" | "program";
  refId: number;
};

export type ShopRec = {
  sku: string;
  title: string;
  amountMinor: number;
  currency: string;
  isBundle: boolean;
  members: { sku: string; qty: number }[];
  matchedTags: string[];
  score: number;
};

export type ShopOrder = {
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

export type Goal = {
  id: number;
  title: string;
  targetPerWeek: number;
  done: boolean;
};

export type NotificationItem = {
  id: number;
  kind: string;
  title: string;
  body: string;
  read: boolean;
};

export type ProgressData = {
  scores: { date: string; score: number; band: string }[];
  completionsByDay: { date: string; count: number }[];
  streak: { count: number; lastDate: string | null };
  milestones: { kind: string; label: string; achievedAt: string }[];
};

export type Rec = {
  kind: string;
  title: string;
  reason: string;
  action: { screen: string; slug?: string };
};

export type Explanation = {
  summary: string;
  reasons: string[];
  sources: { title: string; source: string }[];
  disclaimer: string;
  escalation: string;
};

export type SubPlan = {
  id: number;
  name: string;
  amountMinor: number;
  currency: string;
  interval: string;
};

export type Entitlement = {
  premium: boolean;
  subscription: { planName: string; status: string } | null;
};

export type ReferralInfo = {
  mine: { code: string; status: string }[];
  referredBy: { code: string }[];
};

export type ProductDetail = {
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

export type WishlistItem = {
  id: number;
  kind: "article" | "video" | "product" | "program";
  refId: number;
  title: string | null;
  slug: string | null;
};

export type CartItem = {
  sku: string;
  title: string;
  amountMinor: number;
  currency: string;
  qty: number;
};

export type Ticket = {
  id: number;
  subject: string;
  message: string;
  status: string;
};

export type GameState = {
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

export type DailyTip = {
  title: string;
  body: string;
  source: string;
};

export type HistoryItem = {
  programId: number;
  completedAt: string;
};

export type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; source: string }[];
};

export type ProgramStep = {
  name: string;
  seconds: number;
};

export type Program = {
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

export type QueuedCompletion = {
  userId: number;
  programId: number;
  durationSec: number;
  queuedAt: string;
};
