# **Vyn Therapy Expanded Business PRD**

## **Vision**

AI-powered recovery companion for knowledge workers.

## **Mission**

Deliver personalized recovery guidance, education, habit building and curated products.

## **Value Proposition**

Complete recovery ecosystem instead of product-only commerce.

## **Problem**

Desk-based professionals suffer recurring physical strain and lack integrated recovery support.

## **Target Persona**

·       Knowledge workers  
·       Future: active professionals, healthcare workers

## **Customer Journey**

1\.       Discover  
2\.       Purchase  
3\.       Download App  
4\.       Profile  
5\.       Assessment  
6\.       Recovery Plan  
7\.       Guided Session  
8\.       Progress  
9\.       Recommendations  
10\.   Repeat Purchase  
11\.   Subscription  
12\.   Advocacy

## **User App Features**

### **Home**

·       Check-in  
·       Recovery score  
·       Plan  
·       Streak

### **Recover**

·       Programs  
·       Guided sessions

### **Learn**

·       Articles  
·       Videos

### **Shop**

·       Problem-first shopping  
·       Bundles

### **Progress**

·       Analytics  
·       Milestones

### **Profile**

·       Orders  
·       Goals

## **Admin Features**

·       Dashboard  
·       Users  
·       Products  
·       Orders  
·       Programs  
·       Content  
·       AI KB  
·       QR  
·       Notifications  
·       Analytics  
·       Support

## **Design System**

Source of truth: `packages/tokens/tokens.ts` + `tokens.css`, `packages/ui/src/`, preview in `design.html`. Implementation must follow `docs/implementation-plan.md` Phase 1. No ad-hoc colors/spacing in features — 100% of MVP screens composable from system.

### **Tokens**
- **Brand:** 900 `#0B3D36` (hero) · 700 `#0E5F54` (hover) · 500 `#12836F` (primary) · 300 `#5CB8A3` · 100 `#DCF2EA` (tint) · 50 `#EEFAF5`
- **Accent (streak/energy):** 600 `#D9622B` · 500 `#F97316` · 100 `#FFEDD5`
- **Neutrals:** Ink 900 `#101828` (text) · 700 `#344054` · 500 `#667085` (muted) · 300 `#D0D5DD` (input border) · 100 `#F2F4F7` (border) · 50 `#F9FAFB` (page bg) · White `#FFFFFF`
- **Semantic — recovery score bands:** Low `#E5484D` (<40 · Rest) · Mid `#F5A524` (40–69 · Easy day) · High `#18A957` (≥70 · Ready) · Danger `#D92D20`
- **Typography:** `Inter, Segoe UI, system-ui, -apple-system` · Display 32/800 (-0.5px) · H1 24/700 · H2 20/700 · H3 16/600 · Body 15/400 · Caption 13/muted · 4pt spacing grid
- **Spacing:** xs 4 · sm 8 · md 16 · lg 24 · xl 32 · xxl 40
- **Radius:** sm 8 · md 12 (buttons/inputs) · lg 16 (cards) · full 9999 (badges)
- **Hero:** gradient `brand-900 → brand-500`, 16px radius, white text

### **Core Components (`packages/ui`)**
- **Button** (`primary | secondary | outline | danger`): 15px/600, `12px 24px` padding, `radius-md`, transparent border baseline. Primary `brand-500/white` → hover `brand-700` + shadow; Secondary `brand-100/brand-900`; Outline `brand-500` border; Danger `danger/white`. Disabled: `opacity 0.45, not-allowed`. Active: `scale(0.98)`.
- **TextInput / Textarea:** label 14/600, 15px input, `1.5px ink-300` border, `radius-md`, `12px 14px` padding, max-width 420. Focus: `brand-500` border + `0 0 0 4px brand-100` ring. Invalid: `danger` border + danger ring + 13px error message. Hint 13px `ink-500`.
- **SectionCard:** white bg, `1px ink-100` border, `radius-lg`, `28px` padding, title H2 20/700 + 14px muted sub.
- **Badge** (`low | mid | high | streak | neutral`): 13px/600, `4px 12px` padding, pill. Low red tint · Mid amber tint (`#B7791F` text) · High green tint · Streak `accent-100/accent-600` · Neutral `ink-100/ink-700`.
- **ScoreRing / ProgressRing:** SVG ring, size 120 default, track `ink-100`, band color by value (≥70 high, ≥40 mid, else low), rounded cap, centered 24/800 numeric value, `role="img"` + screen-reader label.
- **StreakFlame:** 🔥 + count + `streak` badge (e.g. Personal best). Timezone-safe count from API.
- **Planned (Phase 1 remainder):** ListRow, Tabs/BottomNav, Header, Avatar, SessionPlayer controls, ArticleCard, VideoCard, ProductCard, BundleCard, Chart primitives, EmptyState, ErrorState, Skeleton.

### **Patterns**
- **Mobile tabs:** Home (ScoreRing + streak card + plan widget + check-in CTA) · Recover (Program list/detail → SessionPlayer) · Learn (ArticleCard/VideoCard + bookmarks) · Shop (ProductCard/BundleCard problem-first) · Progress (score history chart + milestones) · Profile (orders, goals, settings) — all built from tab scaffold + cards + badges.
- **Admin:** table + filter + drawer pattern reused across Users/Products/Orders/Programs/Content/Support; Dashboard KPI cards; QR generate/revoke + scan analytics.
- **States:** loading Skeleton → content → EmptyState → ErrorState with retry; offline SessionPlayer download + sync indicator.

### **Accessibility & Platform Rules**
- WCAG 2.1 AA contrast, touch targets ≥44px, screen-reader labels on score/streak/plan, focus-visible rings, no color-only meaning (badge always pairs color + text: e.g. `High · Ready`).
- Per-platform build from one spec: React Native primitives (mobile) / web primitives (admin). Tokens are platform-agnostic.
- Docs: Storybook (web) + Expo component gallery, with do/don'ts + a11y checklist per component.

## **Locked Technical Decisions**

Decided with stakeholder; implementation must follow `docs/implementation-plan.md`.

·       **User app:** React Native via Expo (iOS + Android, OTA updates) — NOT Next.js web
·       **Admin portal:** Next.js (TypeScript)
·       **Backend API:** Node.js (NestJS recommended)
·       **Auth:** Better Auth, self-hosted + Postgres — NO Supabase, no per-user-fee vendor
·       **Storage:** Cloudflare R2 (S3-compatible) + CDN for videos, images, product media
·       **Payments:** Flutterwave for checkout, refunds, repeat purchase and subscriptions — NO Stripe
·       **Commerce/fulfillment:** NO Shopify. Own product/bundle catalog in Postgres is the system of record. Interim fulfillment via a minimal external WooCommerce bridge store (invisible to customers) so TeemDrop auto-sync can fulfill orders; swap to a direct TeemDrop API behind the same provider interface once confirmed
·       **"Download App" journey step** = native store install (Expo) with push, camera QR scan, offline guided sessions

