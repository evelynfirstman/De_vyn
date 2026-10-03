# Launch checklist (Phase 12) — status 2026-10-03

## SLOs (staging → prod)
- Availability: 99.5% monthly (API + admin).
- API p95 < 500ms prod (local budget 300/800ms per `docs/perf-budgets.md`).
- Webhook → order-paid → fulfillment-queued < 60s.
- Backup age < 24h; restore drill monthly.

## Done
- [x] Phases 0–11 built, tested (18 unit + guardrail evals green), verified live.
- [x] Load test script + budgets doc.
- [x] Backup taken (66 KB) + restore drill passed (30 tables, counts match).
- [x] Restart drill: `docker compose restart api` → `/health` ok (run during Phase 12 verify).
- [x] Security review doc; webhook/PII/QR verified.
- [x] Runbooks for API/DB/Redis/Flutterwave/R2/bridge.

## Open before beta
- [ ] Phase 2b auth: Better Auth + RBAC on `/v1/admin/*` + matrix test. **BLOCKER**
- [ ] Expo Push credentials (milestone/order pushes are in-app only).
- [ ] R2 buckets private + presigned flow (S3Mock locally).
- [ ] `npm audit` highs/criticals triaged (Next 14 advisories open).
- [ ] EAS Build profiles tested (`eas.json` present; first build untested).
- [ ] Store listings, privacy policy (PII export/delete story documented).

## Open before GA
- [ ] Beta cohort (knowledge workers) → top friction fixed.
- [ ] Rollback drill on staging (revert + rebuild + health).
- [ ] TeemDrop direct API or Woo bridge store live (fulfillment currently parks).
- [ ] Real Flutterwave keys + first live test charge + refund.

## Rollback (procedure, tested pattern)
`git log --oneline -5` → `git revert <sha>` →
`docker compose up -d --build <service>` → verify `/health` + smoke flow.
Migrations are additive-only (no destructive DDL), so code rollback
never needs a DB downgrade.
