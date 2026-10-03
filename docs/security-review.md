# Security review (Phase 12) — status 2026-10-03

## Done
- **Webhook signatures:** Flutterwave `verif-hash` enforced, wrong → 401
  (verified); missing secret → 503, never fail-open.
- **PII access/erasure:** `GET /v1/users/:id/export` (full record +
  retention note) and `DELETE /v1/users/:id/data` (activity wiped,
  financial records retained). Both verified.
- **Secrets:** no keys in repo (`.env` gitignored, `.env.example` only);
  QR signing key and webhook secret via env.
- **QR integrity:** HMAC-signed codes, re-verified on resolve; revoked
  codes 404.
- **Input validation:** zod on every route; FK violations → 404, never 500
  leaks (no stack traces to clients; pino logs server-side).
- **Dependency audit:** `npm audit` tracked per release (known Next 14
  advisories open — see launch checklist).

## Launch blockers (must close before GA)
- **Auth/RBAC (Phase 2b):** admin routes currently trust `x-admin-actor:
  dev-admin`; all admin writes are audit-logged but unenforced.
  Required: Better Auth sessions + role checks on `/v1/admin/*`
  + RBAC matrix test.
- **R2 bucket policy:** when media moves to Cloudflare R2, buckets must be
  private with presigned-URL reads/writes only; never expose secret keys
  to clients. Local S3Mock stands in for now.
- **Expo push:** milestone/order notifications are in-app only until
  Expo Push credentials are configured.

## Before each release
1. `npm audit` — triage new highs/criticals.
2. Re-run load test + guardrail evals (`vitest run`).
3. Confirm no secrets in diff (`git diff | grep -i key` sanity scan).
