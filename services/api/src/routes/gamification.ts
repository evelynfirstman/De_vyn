import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

export const gamificationRouter = Router();

const BADGES: {
  id: string;
  title: string;
  check: (s: {
    sessions: number;
    streak: number;
    checkins7d: number;
    milestones: string[];
  }) => boolean;
}[] = [
  { id: "first-step", title: "First step", check: (s) => s.sessions >= 1 },
  { id: "warming-up", title: "Warming up", check: (s) => s.sessions >= 5 },
  {
    id: "double-digits",
    title: "Double digits",
    check: (s) => s.sessions >= 10,
  },
  { id: "streak-3", title: "3-day fire", check: (s) => s.streak >= 3 },
  { id: "streak-7", title: "Week of fire", check: (s) => s.streak >= 7 },
  { id: "streak-30", title: "Unstoppable month", check: (s) => s.streak >= 30 },
  {
    id: "milestone-hunter",
    title: "Milestone hunter",
    check: (s) => s.milestones.length >= 3,
  },
];

const CHALLENGES: {
  id: string;
  title: string;
  target: number;
  progress: (s: {
    sessions: number;
    streak: number;
    checkins7d: number;
  }) => number;
}[] = [
  {
    id: "streak-7",
    title: "7-day check-in streak",
    target: 7,
    progress: (s) => Math.min(s.streak, 7),
  },
  {
    id: "sessions-10",
    title: "Complete 10 sessions",
    target: 10,
    progress: (s) => Math.min(s.sessions, 10),
  },
  {
    id: "checkin-5",
    title: "Check in 5 days this week",
    target: 5,
    progress: (s) => Math.min(s.checkins7d, 5),
  },
];

/**
 * Gamification state (Phase 13): XP rewards consistency, never competition.
 * XP = 10 per session + 5 per check-in. Level = every 100 XP.
 */
gamificationRouter.get("/gamification", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.query.userId);
    const [sessions, checkins, streakRaw, milestones] = await Promise.all([
      pool.query(
        "SELECT COUNT(*)::int AS total FROM session_completions WHERE user_id = $1",
        [userId],
      ),
      pool.query(
        "SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE check_date >= (CURRENT_DATE - INTERVAL '6 days'))::int AS week FROM check_ins WHERE user_id = $1",
        [userId],
      ),
      pool.query(
        "SELECT check_date::text AS d FROM check_ins WHERE user_id = $1 ORDER BY check_date DESC LIMIT 60",
        [userId],
      ),
      pool.query("SELECT kind FROM milestones WHERE user_id = $1", [userId]),
    ]);

    // Current streak from consecutive-day chain ending today/yesterday.
    const dates = (streakRaw.rows as { d: string }[]).map((r) => r.d);
    const today = new Date().toISOString().slice(0, 10);
    const dayBefore = (iso: string) => {
      const d = new Date(`${iso}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() - 1);
      return d.toISOString().slice(0, 10);
    };
    let streak = 0;
    if (dates[0] === today || dates[0] === dayBefore(today)) {
      let cursor = dates[0];
      for (const d of dates) {
        if (d !== cursor) break;
        streak += 1;
        cursor = dayBefore(cursor);
      }
    }

    const stats = {
      sessions: sessions.rows[0].total as number,
      checkins: checkins.rows[0].total as number,
      checkins7d: checkins.rows[0].week as number,
      streak,
      milestones: (milestones.rows as { kind: string }[]).map((r) => r.kind),
    };
    const xp = stats.sessions * 10 + stats.checkins * 5;
    res.json({
      data: {
        xp,
        level: Math.floor(xp / 100) + 1,
        xpToNext: 100 - (xp % 100),
        badges: BADGES.map((b) => ({
          id: b.id,
          title: b.title,
          earned: b.check(stats),
        })),
        challenges: CHALLENGES.map((c) => ({
          id: c.id,
          title: c.title,
          target: c.target,
          progress: c.progress(stats),
          done: c.progress(stats) >= c.target,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});
