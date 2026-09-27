# PRD Changelog — v1 → Expanded Business PRD

Baseline: committed PRD (`74950ee`, "Vyn Therapy Admin & App PRD", 217 lines).
Current: `docs/prd-vyn.md` ("Vyn Therapy Expanded Business PRD", ~99 lines + Locked Technical Decisions).

## What changed and why it matters for build scope

### 1. Title / framing
- **Before:** "Vyn Therapy Admin & App Product Requirements Document"
- **After:** "Vyn Therapy Expanded Business PRD"
- Effect: doc is now the business source of truth; implementation plan derives phases from it.

### 2. Vision — narrowed to a persona
- **Before:** "world's most trusted digital recovery companion… simple, personalized, accessible" (generic).
- **After:** "AI-powered recovery companion for knowledge workers."
- Effect: MVP targets desk-based users, not athletes/parents/travelers/older adults.

### 3. Mission / Value / Problem — rewritten, sharper
- Mission now: personalized guidance + education + habit building + curated products.
- Value now: "complete recovery ecosystem instead of product-only commerce."
- Problem now: "desk-based professionals suffer recurring physical strain and lack integrated recovery support" (was: buying products without guidance).
- Effect: Shop must be problem-first (pain → bundle), not a generic store.

### 4. Removed: Objectives, Goals, Target Users (6 segments), User Roles (8 roles)
- Dropped broad objectives (daily plans, repeat purchase, subscriptions, Shopify dropshipping) and goals (loyalty, premium brand).
- 6 user segments → single **Target Persona**: knowledge workers (+ future: active professionals, healthcare workers).
- 8 admin user roles removed (RBAC design now derives from the 11 admin modules instead).
- Effect: smaller MVP surface; roles/permissions simplified.

### 5. Customer Journey — 7 vague steps → 12 concrete steps
- **Before:** Discover, Explore, Purchase, Onboard, Recover Daily, Retain, Advocate.
- **After:** Discover, Purchase, Download App, Profile, Assessment, Recovery Plan, Guided Session, Progress, Recommendations, Repeat Purchase, Subscription, Advocacy.
- Effect: each step maps to a build phase (Phases 3–8, 11); "Download App" locks in a native Expo app.

### 6. Features — flat MVP list → 6 app tabs
- **Before:** 10-item MVP list (onboarding, daily assessment, AI plan, sessions, progress, product library, QR, Shopify shopping, education, notifications) + separate Phase 2 (coach, score, recommendations, check-ins, subscription).
- **After:** Home (check-in, score, plan, streak) · Recover (programs, sessions) · Learn (articles, videos) · Shop (problem-first, bundles) · Progress (analytics, milestones) · Profile (orders, goals). Phase 2 folded into tabs.
- Effect: score/streak/subscription are core, not later; tab scaffolds drive Phase 1 design system.

### 7. Admin — 17 modules → 11 modules
- **Before:** Dashboard, User Mgmt, Product Sync, Orders, Programs, Exercise Library, AI KB, Content, QR Manager, Notifications, Analytics, Marketing, Support, Subscriptions, Reports, Settings (+ second "Business PRD" section repeating a shorter list).
- **After:** Dashboard, Users, Products, Orders, Programs, Content, AI KB, QR, Notifications, Analytics, Support.
- Dropped/merged: Product Sync (no Shopify), Exercise Library (folded into Programs), Marketing, Subscriptions, Reports, Settings, and the duplicate Business PRD section.
- Effect: slimmer admin build (Phase 9); subscriptions handled via Flutterwave, not an admin module.

### 8. Removed: Success Metrics (DAU, retention, routine completion, repeat purchase, subscription conversion, CSAT)
- Effect: metrics to be redefined during Phase 9 Analytics; funnels derive from the 12-step journey.

### 9. Added: Locked Technical Decisions
- New section at the end of the PRD recording stakeholder decisions: Expo React Native app, Next.js admin, Node.js API, Better Auth (no Supabase), Cloudflare R2, Flutterwave (no Stripe), no Shopify — own catalog with interim WooCommerce bridge → TeemDrop fulfillment.
- Effect: decisions live with requirements so future PRD edits stay consistent with the stack.
