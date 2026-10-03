# Runbooks (Phase 12)

## API down (`GET /health` fails)
1. `docker compose ps` — is `vyn-api-1` restarting?
2. `docker logs vyn-api-1 --tail 50` — migration failure? (fix SQL,
   rebuild) / DB unreachable? (see Postgres).
3. `docker compose restart api` → re-check `/health`.
4. Rollback: `git log --oneline -3`, `git revert <bad-commit>`,
   `docker compose up -d --build api`.

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
- `failed`: inspect `last_error` on the order, fix creds/network,
  then re-dispatch (Phase 13: admin retry button).
