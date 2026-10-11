# Runbooks (Phase 12)

## API down (`GET /health` fails)
1. `docker compose ps` — is `vyn-api-1` restarting?
2. `docker logs vyn-api-1 --tail 50` — migration failure? (fix SQL,
   rebuild) / DB unreachable? (see Postgres).
3. `docker compose restart api` → re-check `/health`.
4. Rollback: `git log --oneline -3`, `git revert <bad-commit>`,
   `docker compose up -d --build api`.

## API deploy (Render)
- Config lives in `render.yaml` (repo root). DB/Redis/storage are external
  (Neon / Upstash / R2); nothing runs on Render itself.
- One-time: Dashboard -> New + -> Blueprint -> connect the repo; fill the
  `sync: false` env vars (`DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_*`,
  `CORS_ORIGINS`, `S3_*`, `FLUTTERWAVE_*`, `GROQ_API_KEY`, `QR_SECRET`).
- URL-based vars use `https://vyn-api.onrender.com`: `BETTER_AUTH_URL`,
  `FLUTTERWAVE_REDIRECT_URL`, and `CORS_ORIGINS` (add admin + PWA origins).
- Auto-deploys on push (`autoDeploy: true`); migrations run on boot.
- Free plan spins down after ~15 min idle -> first request cold-starts
  (30-60s); the in-process fulfillment worker pauses while asleep.
- Build the image locally with:
  `docker build -f services/api/Dockerfile -t vyn-api .`
- Point the clients at it: rebuild the PWA with
  `EXPO_PUBLIC_API_URL=https://vyn-api.onrender.com` (`npm run build:pwa`) and
  set the admin's `NEXT_PUBLIC_API_URL=https://vyn-api.onrender.com`.

## Postgres down / data
- Healthy check: `docker compose exec -T postgres pg_isready -U vyn`.
- Nightly backup: `docker compose exec -T postgres pg_dump -U vyn -d vyn > backups/vyn-$(date +%F).sql`
- Restore drill (tested 2026-10-03): create `vyn_restore`, restore dump,
  compare table/row counts, drop scratch DB. Full steps in chat history
  and `docs/launch-checklist.md`.
- Never delete the `pgdata` volume unless backups are verified.

## Redis down
- API degrades: health reports `degraded`, streaks fall back to Postgres
  rebuild, scores/check-ins keep working. Restart redis, no data loss
  that matters (streak cache rebuilds on next write).

## Flutterwave webhooks failing
- Check signature secret matches dashboard `verif-hash`.
- `payments` stuck `pending` + order `pending_payment`: re-deliver from
  Flutterwave dashboard or replay manually with the tx_ref.
- Live refunds only with `FLUTTERWAVE_LIVE=true`; stub mode refuses (409).

## R2 / media (when live)
- Playback URLs 403: check bucket policy (private + presigned only) and
  key expiry. Locally: S3Mock on :9090, buckets recreated by `s3-init`.

## WooCommerce bridge (interim)
- `fulfillmentStatus: awaiting-config` = normal until WOO_* creds exist.
- Mirror the catalog first: `npm run woo:sync --workspace services/api`
  (`-- --dry-run` to preview). Orders reference these SKUs.
- `failed`: inspect `last_error` on the order, fix creds/network, then
  retry via `POST /v1/admin/orders/:id/fulfillment/retry`.
- A background worker re-pushes failed/queued jobs (cap 8 attempts) and
  pulls tracking back from Woo every `FULFILLMENT_POLL_MS`; set
  `FULFILLMENT_WORKER=false` to disable.
- Bundle SKUs: `WOO_BUNDLE_MODE=expand` (default) ships members;
  `as-is` mirrors the bundle SKU 1:1.

## PWA (apps/mobile web export)
1. Build (bakes `EXPO_PUBLIC_API_URL` in at build time):
   `$env:EXPO_PUBLIC_API_URL="https://vyn-api.onrender.com"; npm run build:pwa`
2. Output in `apps/mobile/dist` (index.html + manifest + sw.js + `_redirects`/`_headers`).
3. Deploy: `npm run deploy:pwa` (Netlify CLI; a separate site from the admin app).
4. Stale shell after deploy? Bump `CACHE` in `apps/mobile/public/sw.js`
   (`vyn-therapy-v2`) — `sw.js`/`index.html` are served no-cache.

## Android APK (EAS)
1. One-time: `eas login` then `cd apps/mobile && eas init` (writes
   `extra.eas.projectId` into app.json).
2. Build: `npm run build:apk` (`eas build -p android --profile preview`,
   `distribution: internal` + `buildType: apk`).
3. Install the APK from the EAS link on-device; it is not on Play Store.
