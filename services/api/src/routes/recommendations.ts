import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { displayStreak } from "../streak";
import { readStreak } from "./home";

export const recommendationsRouter = Router();

type Rec = {
  kind: string;
  title: string;
  reason: string;
  action: { screen: string; slug?: string };
};

/**
 * Rules-based recommendation feed v1 (Phase 8). Every item carries a
 * human-readable reason — no black boxes. ML ranking comes in Phase 10.
 */
recommendationsRouter.get("/recommendations", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.query.userId);
    const today = new Date().toISOString().slice(0, 10);
    const recs: Rec[] = [];

    const [
      profileRes,
      scoresRes,
      checkInRes,
      completionsRes,
      planRes,
      ordersRes,
      streakState,
      shortestRes,
      bundleRes,
    ] = await Promise.all([
      pool.query(
        'SELECT pain_areas AS "painAreas" FROM profiles WHERE user_id = $1',
        [userId],
      ),
      pool.query(
        "SELECT score FROM recovery_scores WHERE user_id = $1 ORDER BY check_date DESC LIMIT 2",
        [userId],
      ),
      pool.query(
        "SELECT id FROM check_ins WHERE user_id = $1 AND check_date = $2",
        [userId, today],
      ),
      pool.query(
        "SELECT COUNT(*)::int AS total FROM session_completions WHERE user_id = $1 AND completed_at >= (now() - INTERVAL '7 days')",
        [userId],
      ),
      pool.query(
        "SELECT id FROM recovery_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [userId],
      ),
      pool.query(
        "SELECT COUNT(*)::int AS total FROM orders WHERE user_id = $1 AND status IN ('paid', 'fulfilled')",
        [userId],
      ),
      readStreak(userId, today),
      pool.query(
        "SELECT slug, title, duration_min FROM programs ORDER BY duration_min ASC LIMIT 1",
      ),
      pool.query(
        `SELECT sku, title, problem_tags AS "problemTags" FROM products WHERE is_bundle = true`,
      ),
    ]);

    const pains = (profileRes.rows[0]?.painAreas ?? []) as string[];
    const scores = scoresRes.rows.map((r) => r.score as number);
    const streakCount = displayStreak(streakState, today);
    const completions7d = completionsRes.rows[0].total as number;
    const hasPlan = planRes.rows.length > 0;
    const paidOrders = ordersRes.rows[0].total as number;
    const shortest = shortestRes.rows[0] as
      { slug: string; title: string; duration_min: number } | undefined;

    if (scores.length >= 2 && scores[0] < scores[1] && shortest) {
      recs.push({
        kind: "lighter-day",
        title: shortest.title,
        reason: `Your score dipped ${scores[1]} → ${scores[0]}, so take a lighter day.`,
        action: { screen: "program", slug: shortest.slug },
      });
    }

    if (checkInRes.rows.length === 0) {
      recs.push({
        kind: "check-in",
        title: "Daily check-in",
        reason:
          streakCount > 0
            ? `Check in to keep your ${streakCount}-day streak alive.`
            : "Check in to start a streak.",
        action: { screen: "home" },
      });
    }

    if (hasPlan && completions7d === 0 && shortest) {
      recs.push({
        kind: "get-moving",
        title: shortest.title,
        reason: `No completed session this week — start with ${shortest.title} because it only takes ${shortest.duration_min} min.`,
        action: { screen: "program", slug: shortest.slug },
      });
    }

    if (streakCount === 6) {
      recs.push({
        kind: "streak-close",
        title: "7-day streak within reach",
        reason: "One more check-in locks your 7-day streak milestone.",
        action: { screen: "home" },
      });
    }

    if (paidOrders === 0 && pains.length > 0) {
      const bundles = bundleRes.rows as {
        sku: string;
        title: string;
        problemTags: string[];
      }[];
      const ranked = bundles
        .map((b) => ({
          ...b,
          overlap: b.problemTags.filter((t) => pains.includes(t)),
        }))
        .sort((a, b) => b.overlap.length - a.overlap.length);
      if (ranked.length > 0 && ranked[0].overlap.length > 0) {
        recs.push({
          kind: "bundle",
          title: ranked[0].title,
          reason: `It targets ${ranked[0].overlap.join(", ")} — the areas you flagged.`,
          action: { screen: "shop" },
        });
      }
    }

    res.json({ data: recs.slice(0, 4) });
  } catch (err) {
    next(err);
  }
});
