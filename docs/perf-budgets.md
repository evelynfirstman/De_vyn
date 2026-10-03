# Performance budgets (Phase 12)

## API (`services/api`, local Docker)
- Reads p95 < 300ms, writes p95 < 800ms, zero 5xx.
- Verified 2026-10-03 via `node services/api/loadtest.mjs`
  (20 concurrent × 10 rounds over /health, /v1/programs,
  POST /v1/check-ins, /v1/home). Re-run before every release.

## Admin web (`apps/admin`)
- First Load JS ≤ 100 kB per route (observed 90–99 kB, Next 14 build).
- Tables paginate at 100 rows max; no unbounded queries.

## Mobile (`apps/mobile`)
- App start (cold, mid-range Android): < 2s to interactive Home.
- Guided-session timer must not drift > 1s per step (uses timeouts,
  not intervals —verify on device during beta).
- Offline queue flushes on launch and after every successful submit.

## Data
- Postgres indexes on all `user_id` foreign-key lookups and
  `(user_id, created_at)` feeds; EXPLAIN any new filtered query.
