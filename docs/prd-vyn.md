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

Source of truth: `packages/tokens/tokens.ts` + `tokens.css`, `packages/ui/src/`, preview in `design.html`, screens in `docs/Vyn Therapy UI_UX/` (11 `code.html` + `vyn_therapy/DESIGN.md`). Implementation must follow `docs/implementation-plan.md` Phase 1. No ad-hoc colors/spacing in features — 100% of MVP screens composable from system.

### **Tokens**
- **Brand:** 900 `#0B3D36` (hero) · 700 `#0E5F54` (hover) · 500 `#12836F` (primary-container/CTAs) · 300 `#5CB8A3` · 100 `#DCF2EA` (tint) · 50 `#EEFAF5` (ghost) · splash-mid `#0D4E45`
- **Accent (streak/energy):** 600 `#D9622B` · 500 `#F97316` (kinetic CTAs only) · 100 `#FFEDD5`
- **M3 surfaces:** base `#F9F9FF` · dim `#D2DAF0` · lowest `#FFFFFF` · low `#F1F3FF` · container `#E9EDFF` (ring track, segmented bg) · high `#E0E8FF` · highest `#DBE2F9` · on `#141B2C` · onVariant `#3E4945` · tint `#006B5A` · inverse `#293041/#EDF0FF`
- **Primary/Secondary/Tertiary:** primary `#006857` (text/icons) · secondary `#3A665E/#BCECE2` · tertiary `#994100/#C05400/#FFDBCA` · fixed `#94F4DC/#78D8C0` · error `#BA1A1A/#FFDAD6`
- **Neutrals:** Ink 900 `#101828` · 700 `#344054` · 500 `#667085` · 300 `#D0D5DD` · 100 `#F2F4F7` (borders) · 50 `#F9FAFB` · onboarding extras `#1D2939/#475467/#EAECF0/#E4E7EC/#F0F9F6/#F8FAFC`
- **Semantic — recovery score bands:** Low `#E5484D` (<50 · Rest) · Mid `#F5A524` (50–79 · Easy day) · High `#18A957` (80–100 · Ready) · Danger `#D92D20`
- **Typography:** `Plus Jakarta Sans, Inter fallback` · display-hero 48/56/700 · display 32 · H1 24/700 · H2 20/700 · H3/title-md 16/600 · body-lg 18 · body 15 · body-sm 13 · label-lg 14/600 · label-md 12/600 · label-caps 11/700 +0.06em uppercase · 4pt/8pt rhythm
- **Spacing:** xs 4 · sm 8 · md 16 · lg 24 · xl 32 · xxl 40 · gutter 24 (mobile 16) · margins mobile 16 / desktop 48
- **Radius:** sm 4 (checkbox) · DEFAULT 8 (buttons/inputs/chips) · md 12 · lg 16 (cards) · xl 24 (heroes/modals) · full 9999 (pills/badges)
- **Elevation:** L1 `0 1px 3px rgba(16,24,40,.05)` (cards) · L2 green-tinted `0 8px 16px -4px rgba(11,61,54,.06)` (drawers/overlays) · L3 `0 20px 24px -4px rgba(16,24,40,.08)` + backdrop `rgba(11,61,54,.4) blur(8px)` (modals) · card-selected `0 4px 14px -2px rgba(18,131,111,.12)` · sticky-bar + nav shadows
- **Hero/Splash:** app hero gradient `brand-900 → brand-500`, 24px radius; splash full-bleed `brand-900 → #0D4E45 → brand-500`, 112px logo (outer V `#DCF2EA`, inner V `#12836F`, dot `#F97316`), loader bar

### **Core Components (`packages/ui`)**
- **Button** (`primary | secondary | outline | danger | kinetic`): label-lg 14/600, `12px 24px`, 44px min-height, `radius 8px`. Primary `brand-500/white → hover brand-700`; Secondary `white/1px ink-100 → hover ghost + brand-500 border`; Kinetic `accent-500/white` (session completion/streak only); Disabled `opacity .45`. Active `scale(.98)`, 150ms ease-out.
- **TextInput / Textarea:** label 14/600, 44px height, `1px ink-100` border, `radius 8px`, max-width 420. Focus: `brand-500` + `3px rgba(18,131,111,.15)` ring. Invalid: `danger` + error text.
- **SectionCard + MetricPod:** white, `1px ink-100`, `radius-lg`, L1 shadow; MetricPod adds 4px top indicator strip (green/amber/red by tier) + 3-col stat layout.
- **Badge/Chip** (`low | mid | high | streak | neutral`): 13/600 pill `4px 12px` + dot; Streak `accent-100/accent-600` + flame.
- **ScoreRing:** 120px SVG, track `surface-container #E9EDFF`, stroke 10, bands ≥80/≥50 else, `role=img` + `aria-label`.
- **Navigation:** `AppHeader` (sticky blur, 40px hamburger `#E9EDFF`, title, avatar) + `BottomNav` (5 tabs Home/Recover/Learn/Shop/Progress, active `brand-500`, safe-area padding).
- **Selection:** `SegmentedControl` (container bg, active white + shadow + `brand-500/20` border) · `SelectableCard` (radio/checkbox cards: selected `2px brand-500` + `#F0F9F6` + card-selected shadow; 24px checkbox / 20px radio; `High Strain` mint tag) · severity slider (amber thumb + glow).
- **Recovery:** `RegionBar` (h8 track, tier fill, % pill, caption) · `StreakDots` (7-dot) · `RoutineHeroCard` (dark `#0B3D36`, `radius-xl`, countdown, white CTA).
- **Overlays:** `QrScannerModal` (backdrop `#293041/80` blur, 192px viewfinder, laser `accent-500/brand-500`, Simulate Scan) · `Toast` (`#293041` pill, +XP) · `OnboardingShell` (390px frame, step bar, sticky 52px CTA + HIPAA note + home indicator) · Micro-break drawer (fixed bottom L2 banner).
- **Commerce/Learn:** pain-point grid (selectable `ring-2 brand-500`), dark bundle hero (`#293041`, Save %, checklist, Ecosystem Sync perk), product cards (fav blur btn, stars `#C05400`), Masterclass hero + carousel + Linked Protocol sub-cards, HIPAA export CTA.

### **Screen Map (UI_UX → tabs)**
- Splash → gradient + loader → Welcome → Better Auth → Onboarding Step 1 desk-context (occupation/hours/workstation) → Step 2 strain-focus (5 pain cards + severity slider) → Step 3 hardware-pairing (QR viewfinder + 4 checkboxes) → Step 4 baseline (Resilience Index + 30-day protocol) → Home (check-in hero, score 78, streak, protocol, load distribution, quick-log, toast)
- Recover (filter pills, session cards, offline-sync + QR banner) · Learn (QR banner, masterclass, carousel, topic pills, guides + QR modal/drawer) · Shop (pain-point grid, bundle hero, products, AI scan promo, trust banner, Flutterwave 1-click) · Progress (segmented, trajectory chart, metric pods, region bars, milestones, export) · Profile (user card, hardware, goals 68%, account list, sign-out `error`)

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

