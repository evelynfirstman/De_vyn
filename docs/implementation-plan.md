# Vyn Therapy — Implementation Plan

Source: `docs/prd-vyn.md` (Expanded Business PRD).
Scope: AI-powered recovery companion for knowledge workers. User app tabs: Home, Recover, Learn, Shop, Progress, Profile. Admin: Dashboard, Users, Products, Orders, Programs, Content, AI KB, QR, Notifications, Analytics, Support.

## 0. Architectural Decisions (LOCKED)

Locked stack: **React Native via Expo** (user mobile app) · **Next.js** (admin portal) · **Node.js API** · **Flutterwave** payments · **No Supabase / no Shopify** · **Better Auth** (free, self-hosted) · **Cloudflare R2** storage · Fulfillment via **WooCommerce bridge → TeemDrop** (interim; direct TeemDrop API later).

### 0.1 Monorepo layout
```
.
├── apps/
│   ├── mobile/        # User app (Expo React Native: Home, Recover, Learn, Shop, Progress, Profile)
│   └── admin/         # Admin portal (Next.js: all 11 admin modules)
├── packages/
│   ├── ui/            # Design system (tokens + per-platform components from Phase 1)
│   ├── tokens/        # Design tokens (color, type, spacing) shared by app + admin
│   ├── api-client/    # Typed API client + contracts (used by mobile + admin)
│   └── config/        # ESLint, TS, env schemas
├── services/
│   └── api/           # Node.js backend API + workers (incl. fulfillment module)
├── docs/
│   ├── prd-vyn.md
│   └── implementation-plan.md
├── docker-compose.yml # Local hosting (postgres, redis, api, admin, expo-web preview)
└── README.md
```

Fulfillment bridge: a minimal external WooCommerce store (hosted outside Compose — customers never see it) exists only so TeemDrop auto-sync can pick up orders. See Phase 7.

Why Expo for the user app: one TypeScript codebase ships real iOS + Android apps (matches PRD "Download App" with store presence), OTA updates via EAS Update for plan/content tweaks without store review, and native camera (QR scan), push notifications, offline video download, and future HealthKit/Google Fit integration. Admin stays Next.js web — tables, charts, and RBAC workflows are unsuitable for mobile. Both apps share TS types, design tokens, and the generated API client (see "Why monorepo" below).

### 0.2 Stack decisions
| Area | Decision | Rationale |
|---|---|---|
| User app | React Native via Expo (TypeScript) | One codebase for iOS + Android; OTA updates; native QR camera, push, offline video; real store presence for "Download App" |
| Admin portal | Next.js (TypeScript) | Dashboard/analytics/content CRUD needs tables, charts, RBAC |
| Backend API | Node.js (NestJS recommended; Fastify/Express acceptable) | One language (TS) across mobile/admin/API; owns OpenAPI contracts, Flutterwave webhooks, fulfillment outbox + provider adapters, QR signing, score engine |
| DB | Postgres (primary) + Redis (cache/queues/streaks) | Profiles, plans, orders, content, analytics events; free, self-hostable in Compose |
| Auth | **Better Auth** (self-hosted, open-source, free) + Postgres | No Supabase, no per-user fees; Expo plugin for the mobile app + Next.js integration for admin; fallback: Auth.js (NextAuth) |
| Storage | **Cloudflare R2** (S3-compatible) + CDN | Free-egress object storage for videos, article images, product media; local S3 emulator (e.g. MinIO/Garage) in Compose for dev |
| Search/KB | Postgres full-text first, vector store later (pgvector) | AI KB starts curated, embeddings in later phase |
| Payments | **Flutterwave** (products/bundles/orders + subscriptions/recurring) | Single PSP for checkout, webhooks, refunds, repeat purchase and subscription plans |
| Fulfillment | WooCommerce bridge store → TeemDrop auto-sync (interim); direct TeemDrop API later | No Shopify; app stays system of record; `FulfillmentProvider` interface in API makes the bridge swappable |
| Notifications | Expo Push (APNs/FCM) + email (transactional provider, e.g. Resend free tier) | Check-ins, streaks, order updates |
| Analytics | Event pipeline (PostHog free tier / self-hosted) + admin dashboards | Progress analytics, milestones, admin analytics |
| QR | Backend-signed QR payloads (product/program deep links) | Admin QR module + in-app scan via expo-camera |

### 0.3 API + data contracts first
- OpenAPI spec owned by `services/api`, generated typed client in `packages/api-client` consumed by the Expo app and the Next.js admin.
- Better Auth tables live alongside app schema in Postgres (or separate schema `auth`).
- Core entities: User, Profile, Assessment, RecoveryPlan, Program, GuidedSession, CheckIn, RecoveryScore, Article, Video, Product, Bundle, Order, Payment (Flutterwave refs), FulfillmentOrder (bridge refs: Woo order id, TeemDrop status, tracking), Goal, Milestone, Notification, QRCode, KBDocument, SupportTicket, AnalyticsEvent.
- Every entity gets: owner, timestamps, soft-delete where user-facing, audit log for admin actions.
- Checkout → fulfillment uses an outbox: paid Order first, then exactly-once mirrored fulfillment order (bridge Woo id stored); retries with backoff, dead-letter + admin retry button.

### 0.4 Non-functional requirements
- Accessibility WCAG 2.1 AA (contrast, touch targets ≥44px, screen-reader labels on score/streak/plan).
- Offline-first guided sessions (Expo file-system video download + progress sync).
- Observability: structured logs, traces, health checks per service.
- Security: RBAC for 11 admin modules, PII minimization, secrets via env vault, **Flutterwave webhook signature verification**, R2 presigned-URL uploads (never expose secret keys to the app).

---

## Phase 1 — Design System (do before any feature UI)

Goal: one visual language shared by the Expo user app + Next.js admin.

1. **Tokens** (`packages/tokens`): color (light/dark, brand + semantic: recovery score bands, streak, danger), typography scale (display → caption), spacing (4pt grid), radius, elevation, motion durations. Tokens are platform-agnostic and consumed by both apps.
2. **Core components** (`packages/ui`): Button, Input, Card, ListRow, Tabs/BottomNav, Header, Avatar, Badge, ProgressRing (recovery score), StreakFlame, SessionPlayer controls, ArticleCard, VideoCard, ProductCard, BundleCard, Chart primitives, EmptyState, ErrorState, Skeleton. Implement per platform from one spec (React Native primitives for mobile, web primitives for admin).
3. **Patterns**: tab scaffolds for Home/Recover/Learn/Shop/Progress/Profile; admin table + filter + drawer pattern reused across Users/Products/Orders/Programs/Content/Support.
4. **Docs**: Storybook (web) + Expo component gallery for mobile, with do/don'ts; a11y checklist per component.
5. **Definition of done**: tokens versioned; 100% of MVP screens composable from system; no ad-hoc colors/spacing in features.

## Phase 2 — Platform Foundation + Local Hosting

1. Monorepo + TS strict + lint/format + CI (typecheck, lint, unit tests).
2. `docker-compose.yml`: Postgres, Redis, Node API, Next.js admin, S3 emulator (dev stand-in for R2); seeded demo user + content. Expo runs on dev machine via `npx expo start`, pointed at the Compose API.
3. Better Auth wired into Expo app + Next.js admin + Node API session verification; RBAC roles for admin modules.
4. R2 buckets (e.g. `vyn-media`, `vyn-products`) + dev emulator parity; presigned upload flow tested.
5. Environments: `.env` schema validation; `local` (compose), `staging`, `prod` parity.
6. Health endpoints, logging, error envelope, pagination/filter conventions.
7. DoD: `docker compose up` + `npx expo start` gives working API + admin login + empty app shell.

## Phase 3 — User App: Profile → Assessment → Recovery Plan (journey steps 4–6)

1. Profile onboarding (goals, pain areas, equipment, time available).
2. Assessment flow (questionnaire + check-in inputs).
3. Recovery plan generator v1 (rules-based from assessment; AI later): plan = sessions/week mapped to programs.
4. Persist: Profile, Assessment, RecoveryPlan.
5. DoD: new user completes profile → assessment → sees a plan on Home.

## Phase 4 — Home Tab (check-in, recovery score, plan, streak)

1. Daily check-in (soreness, sleep, stress, activity) → stored as CheckIn.
2. Recovery score v1: deterministic formula from check-ins + completion (document weights; ML later).
3. Plan widget (today's session), streak counter (Redis-backed, timezone-safe) + push reminder on missed check-in.
4. DoD: score + streak update correctly across days; missed-day and timezone edge cases tested.

## Phase 5 — Recover Tab (programs + guided sessions)

1. Program catalog (list/detail/filter by problem area, level, duration).
2. Guided session player (steps, timers, R2-hosted video; offline download via Expo file-system).
3. Session completion → feeds score, streak, progress.
4. Admin dependency: Programs CRUD minimal (title, steps, media) — full admin UI in Phase 9.
5. DoD: user completes a guided session offline and it syncs.

## Phase 6 — Learn Tab (articles + videos)

1. Article/video library with categories and search.
2. Detail views + bookmarks + "related to my plan" surfacing.
3. R2 + CDN media delivery; admin Content CRUD minimal.
4. DoD: content linked from plan and searchable.

## Phase 7 — Shop Tab (problem-first shopping + bundles, Flutterwave)

1. Own product/bundle catalog in Postgres — the app's system of record (no Shopify): Products module manages SKUs, bundles, pricing.
2. Bridge mirror: scripted sync pushes SKUs (same codes) to a minimal external WooCommerce store; import those products into TeemDrop once and enable auto-fulfill. Customers never visit this store.
3. Problem-first shopping: problem → recommended bundle mapping (curated first, no ML).
4. Cart/checkout via **Flutterwave** (inline checkout / hosted links); verify webhooks, store Payment + Order; on paid, the fulfillment outbox creates a mirrored order in WooCommerce (same SKUs + customer shipping address) → TeemDrop auto-syncs and fulfills.
5. Tracking back: TeemDrop → Woo order notes → API polls Woo (webhooks later) → updates FulfillmentOrder + Order status → push notification + tracking shown in Profile → Orders.
6. QR deep links to products/programs (in-app scan via expo-camera → resolve).
7. Exit path: all bridge calls go through a `FulfillmentProvider` interface — when TeemDrop confirms a direct API, swap the provider without touching checkout.
8. DoD: purchase flow end-to-end in staging; Flutterwave + bridge flows verified (including retries/duplicates); tracking appears in app + admin Orders; failed fulfillment retries from admin.

## Phase 8 — Progress + Profile Tabs (analytics, milestones, orders, goals)

1. Progress: completion charts, score history, milestones engine (e.g. 7-day streak, first bundle completed).
2. Profile: goals CRUD, orders list, settings, sign-out/delete-data.
3. Recommendations feed (journey step 9, rules-based v1: "because your score dipped…").
4. DoD: milestones trigger push notifications; recommendations explain their reason.

## Phase 9 — Admin Portal (all 11 modules)

Build in this order, reusing one table/detail pattern:
1. Dashboard (KPIs: active users, plans completed, orders, revenue).
2. Users (search, profile/plan view, support actions).
3. Programs (full CRUD + R2 media + versioning).
4. Content (articles/videos CRUD + publishing states).
5. Products + Orders (catalog management, Flutterwave payment status, refunds view, bridge-mirror health + TeemDrop tracking status, manual retry).
6. AI KB (curated documents CRUD, review queue).
7. QR (generate/revoke, scan analytics).
8. Notifications (templates, campaigns, history).
9. Analytics (funnels: Discover→Purchase→Plan→Session→Repeat; cohort retention).
10. Support (tickets tied to users/orders).
11. RBAC audit: every admin write logged with actor + diff.
DoD: support agent can resolve a user issue without DB access; all modules behind permissions.

## Phase 10 — AI Layer (score v2 + KB + coach foundations)

1. Recovery score v2: calibrate v1 weights against completion/outcome data.
2. AI KB on pgvector: retrieval over curated docs for plan explanations + support macros.
3. Guardrails: cited sources, no medical diagnosis claims, escalation to human support.
4. DoD: every AI suggestion shows reason + source; eval set passes before rollout.

## Phase 11 — Growth: Repeat Purchase, Subscription, Advocacy (steps 10–12)

1. Subscriptions via **Flutterwave recurring** (premium plans); entitlements enforced in API.
2. Repeat-purchase nudges (consumable replenishment, bundle upsell) with unsubscribe controls.
3. Referral/advocacy loop + review prompts.
4. DoD: subscription charge/cancel flows tested against Flutterwave webhooks; churn/win-back metrics in Dashboard.

## Phase 12 — Hardening + Launch

1. Performance budgets (app start, player, admin tables), load tests on plan/check-in/score paths.
2. Security review: auth sessions, RBAC matrix test, Flutterwave webhook signatures, R2 bucket policies, PII export/delete.
3. Backup/restore drill; runbooks for API/DB/Flutterwave/R2/bridge-store outages.
4. EAS Build + store submission (iOS/Android), beta via TestFlight/Play internal track with knowledge-worker cohort → fix top friction → GA.
5. DoD: SLOs defined (availability, p95 latency), rollback tested, launch checklist signed.

---

## Build Order Summary
0 Architecture → 1 Design system → 2 Foundation/compose → 3 Profile/Assessment/Plan → 4 Home → 5 Recover → 6 Learn → 7 Shop → 8 Progress/Profile → 9 Admin → 10 AI → 11 Growth → 12 Launch.

## Traceability to PRD
- Home (check-in, score, plan, streak) → Phase 4
- Recover (programs, guided sessions) → Phase 5
- Learn (articles, videos) → Phase 6
- Shop (problem-first, bundles) → Phase 7
- Progress (analytics, milestones) → Phase 8
- Profile (orders, goals) → Phase 8
- Admin 11 modules → Phase 9 (built incrementally from Phase 5 onward as minimal CRUD)
- Journey steps 10–12 (repeat, subscription, advocacy) → Phase 11
- Fulfillment: WooCommerce bridge → TeemDrop (interim, Phase 7) → direct TeemDrop API later (same provider interface)
