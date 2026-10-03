/**
 * Phase 12 load test — plan/check-in/score paths. No dependencies.
 * Usage: node loadtest.mjs [baseUrl]  (default http://localhost:4000)
 *
 * Budgets (local Docker, docs/perf-budgets.md):
 * - reads p95 < 300ms, writes p95 < 800ms, zero 5xx.
 */
const BASE = process.argv[2] ?? "http://localhost:4000";
const CONCURRENCY = 20;
const ROUNDS = 10;

const CHECKIN_BODY = JSON.stringify({
  userId: 1,
  date: "2026-10-06",
  soreness: 3,
  sleepHours: 7,
  stress: 3,
  activity: "loadtest",
  timezone: "UTC",
});

const SCENARIOS = [
  { name: "GET /health", method: "GET", path: "/health" },
  { name: "GET /v1/programs", method: "GET", path: "/v1/programs?pageSize=20" },
  {
    name: "POST /v1/check-ins",
    method: "POST",
    path: "/v1/check-ins",
    body: CHECKIN_BODY,
  },
  {
    name: "GET /v1/home",
    method: "GET",
    path: "/v1/home?userId=1&date=2026-10-06",
  },
];

async function once(s) {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE}${s.path}`, {
      method: s.method,
      headers: { "Content-Type": "application/json" },
      body: s.body,
    });
    await res.text();
    return { ms: performance.now() - start, ok: res.status < 500 };
  } catch {
    return { ms: performance.now() - start, ok: false };
  }
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  return sorted[
    Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  ];
}

let failed = false;
for (const s of SCENARIOS) {
  const lat = [];
  let errors = 0;
  for (let r = 0; r < ROUNDS; r++) {
    const batch = await Promise.all(
      Array.from({ length: CONCURRENCY }, () => once(s)),
    );
    for (const b of batch) {
      lat.push(b.ms);
      if (!b.ok) errors += 1;
    }
  }
  lat.sort((a, b) => a - b);
  const p50 = percentile(lat, 50).toFixed(1);
  const p95 = percentile(lat, 95).toFixed(1);
  const max = Math.max(...lat).toFixed(1);
  const budget = s.method === "GET" ? 300 : 800;
  const pass = parseFloat(p95) < budget && errors === 0;
  if (!pass) failed = true;
  console.log(
    `${pass ? "PASS" : "FAIL"}  ${s.name}  n=${lat.length}  p50=${p50}ms  p95=${p95}ms  max=${max}ms  errors=${errors}  budget-p95<${budget}ms`,
  );
}
process.exit(failed ? 1 : 0);
