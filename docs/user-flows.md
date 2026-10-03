# Vyn Therapy — User Flows (structured from the product design doc)

Design principle: the app guides a **continuous recovery journey**, not a
feature list. Shopping is woven in, never the center.

## 1. Master journey
Discover → Download App → Create Profile → Assessment → Recovery Plan →
Complete Session → Track Progress → Build Habit → Discover Products →
Premium Member.

## 2. Navigation map (6 tabs + drawer)
Bottom tabs: **Home · Recover · Learn · Shop · Progress · Profile**.
Hamburger (Home + Profile headers) → Wishlist · Support · Notifications ·
Settings · Subscription · Sign out.

| Flow step | Tab / screen | API |
|---|---|---|
| First-time: Splash → Welcome → Account → About (occupation, activity) → Goals → Discomfort → Products owned → Generate profile | onboarding screens | `PUT /v1/profiles` (occupation, activityLevel, productsOwned) |
| Daily: open → emoji check-in → plan → session → tip → streak | Home | `POST /v1/check-ins`, `GET /v1/home`, `GET /v1/daily-tip` |
| Session: video → timer → pause/finish → feedback → completion (+score, streak) | Recover → program → feedback → done | `GET /v1/programs/:slug`, `POST /v1/sessions/complete` (rating, feedback) |
| Learning: categories → article (read/save) → related programs/products | Learn → detail | `GET /v1/articles`, `/v1/videos`, `/v1/learn/related`, bookmarks |
| Shopping: session → recommendation → story → cart → checkout → thank-you → **QR unlocks exclusive content** | Shop → product → checkout | `GET /v1/shop/recommendations`, `/v1/products/:sku`, `/v1/shop/checkout`, webhook |
| QR from physical product → product guides + how-to | Shop product detail (via QR resolve) | `GET /v1/qr/resolve` → product + guides |
| Gamification: session → XP → score → streak → badge → challenge | Progress | `GET /v1/gamification` (xp, level, badges, challenges) |
| Notifications: morning/midday/evening nudges, user-controlled | Notifications screen + prefs | `GET /v1/notifications`, `PUT /v1/users/:id/prefs` (scheduler = push infra, Phase 2b) |
| AI coach: check-in → questions → plan → feedback → learns | Home + Plan explanation | `GET /v1/plans/:id/explanation` (guardrailed, cited) |
| Progress evidence: consistency, streak calendar, minutes, milestones | Progress tab | `GET /v1/progress`, `GET /v1/gamification` |

## 3. Flow details kept from the doc
- **Home answers "What should I do today?"**: welcome + score, emoji
  check-in (😁🙂😐😣😫 = 1–5), today's checklist, continue program,
  streak, recommended product (never an ad), daily tip.
- **Session screen**: steps + timer, equipment, safety notes, pause,
  finish, feedback; completion shows score delta + streak.
- **Product page**: story, benefits, how-it-helps, video (when R2 lands),
  routines, related products, buy. Reviews/FAQs arrive with real data.
- **Gamification rewards consistency**, not competition: no public
  leaderboard in v1 (challenges are personal).
- **Notifications are customizable**: promos mute + reminder time live in
  Settings; actual push delivery needs Expo Push credentials (Phase 2b).

## 4. Deliberate gaps (not forgotten)
- Voice guidance, video playback: need R2 media + native player (Phase 2b).
- Camera QR scanning: web preview uses manual code entry; native build
  gets expo-camera.
- Leaderboard, OEM rewards: post-GA.
