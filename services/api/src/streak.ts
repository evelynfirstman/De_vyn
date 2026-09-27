/**
 * Streak engine (Phase 4).
 *
 * Dates are plain YYYY-MM-DD strings in the USER's local timezone
 * (submitted by the client) — never server time. All arithmetic runs
 * at UTC noon so DST transitions can't shift the day boundary.
 * Counter lives in Redis (`streak:{userId}`); Postgres check_ins
 * is the fallback / source of truth for rebuilds.
 */
export type StreakState = {
  count: number;
  /** Last checked-in local date, YYYY-MM-DD. */
  lastDate: string;
};

export function dayBefore(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Monday-first weekday names — matches recovery plan item days. */
export function weekdayName(isoDate: string): string {
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const sundayFirst = new Date(`${isoDate}T12:00:00Z`).getUTCDay();
  return names[(sundayFirst + 6) % 7];
}

export function nextStreak(
  prev: StreakState | null,
  today: string,
): StreakState {
  if (prev === null) return { count: 1, lastDate: today };
  if (prev.lastDate === today) return prev;
  if (prev.lastDate === dayBefore(today)) {
    return { count: prev.count + 1, lastDate: today };
  }
  return { count: 1, lastDate: today };
}

/**
 * Display count for a given date: the chain only counts if the last
 * check-in was today or yesterday — otherwise it already lapsed.
 */
export function displayStreak(
  state: StreakState | null,
  today: string,
): number {
  if (state === null) return 0;
  if (state.lastDate === today || state.lastDate === dayBefore(today)) {
    return state.count;
  }
  return 0;
}
