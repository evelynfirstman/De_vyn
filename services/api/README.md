# @vyn/api — Node.js backend (Phase 2)

Express + TypeScript API. Conventions: zod-validated env, pino logs,
`{ error: { code, message, details } }` error envelope,
`{ data, page: { page, pageSize, total, totalPages } }` list envelope.

## Scripts

- `npm run dev --workspace services/api` — watch mode (tsx)
- `npm run typecheck --workspace services/api` — strict typecheck
- `npm run build --workspace services/api` — emit to `dist/`
- `npm start --workspace services/api` — run built output

## Endpoints

- `GET /health` — `{ status, checks: { db, redis }, version }`
- `GET /v1/programs?page=&pageSize=` — seeded recovery programs
- `GET /v1/articles` — seeded learn content
- `GET /v1/products` — seeded shop catalog (prices in minor units + currency)

Auth (Better Auth), write endpoints, and fulfillment outbox land in later phases.
