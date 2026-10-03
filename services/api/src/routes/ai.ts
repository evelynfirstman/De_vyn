import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { V1_WEIGHTS, type ScoreWeights } from "../score";
import { buildExplanation } from "../explain";

export const aiRouter = Router();

const weightsSchema = z.object({
  base: z.number().min(0).max(100),
  sleepHigh: z.number().min(0).max(50),
  sleepMid: z.number().min(0).max(50),
  sorenessPer: z.number().min(0).max(10),
  stressPer: z.number().min(0).max(10),
  completionPer: z.number().min(0).max(10),
  completionCap: z.number().min(0).max(50),
  highAt: z.number().min(0).max(100),
  midAt: z.number().min(0).max(100),
  streakBonusCap: z.number().min(0).max(20),
});

export async function activeWeights(): Promise<{
  version: "v1" | "v2";
  weights: ScoreWeights;
}> {
  const { rows } = await pool.query(
    "SELECT weights FROM score_configs WHERE is_active = true ORDER BY id DESC LIMIT 1",
  );
  if (rows.length === 0) return { version: "v1", weights: V1_WEIGHTS };
  const weights = rows[0].weights as ScoreWeights;
  const parsed = weightsSchema.safeParse(weights);
  if (!parsed.success) return { version: "v1", weights: V1_WEIGHTS };
  const custom = JSON.stringify(parsed.data) !== JSON.stringify(V1_WEIGHTS);
  return { version: custom ? "v2" : "v1", weights: parsed.data };
}

aiRouter.get("/admin/score-config", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, weights, is_active AS "isActive",
              created_at AS "createdAt"
         FROM score_configs ORDER BY id DESC`,
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

aiRouter.put("/admin/score-config", async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).default("custom"),
        weights: weightsSchema,
      })
      .parse(req.body);
    await pool.query("UPDATE score_configs SET is_active = false");
    const { rows } = await pool.query(
      `INSERT INTO score_configs (name, weights, is_active)
       VALUES ($1, $2, true)
       RETURNING id, name, weights, is_active AS "isActive"`,
      [body.name, JSON.stringify(body.weights)],
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * Calibration analysis (Phase 10): compare score trajectories of users
 * with vs without weekly completions, and suggest a completion weight.
 * Advisory only — applying is a manual PUT above.
 */
aiRouter.post("/admin/score-config/calibrate", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `WITH first_last AS (
         SELECT user_id,
                MIN(check_date) AS first_date, MAX(check_date) AS last_date,
                COUNT(*) AS n
           FROM recovery_scores GROUP BY user_id HAVING COUNT(*) >= 2
       ),
       deltas AS (
         SELECT f.user_id,
                (SELECT score FROM recovery_scores s WHERE s.user_id = f.user_id AND s.check_date = f.last_date) -
                (SELECT score FROM recovery_scores s WHERE s.user_id = f.user_id AND s.check_date = f.first_date) AS delta,
                (SELECT COUNT(*) FROM session_completions c
                  WHERE c.user_id = f.user_id
                    AND c.completed_at >= f.first_date::timestamptz
                    AND c.completed_at < (f.last_date + INTERVAL '1 day')::timestamptz) AS completions
           FROM first_last f
       )
       SELECT COUNT(*)::int AS users,
              AVG(delta)::float AS avg_delta_all,
              AVG(delta) FILTER (WHERE completions > 0)::float AS avg_delta_active,
              AVG(delta) FILTER (WHERE completions = 0)::float AS avg_delta_idle,
              AVG(completions)::float AS avg_completions
         FROM deltas`,
    );
    const stats = rows[0] as {
      users: number;
      avg_delta_all: number | null;
      avg_delta_active: number | null;
      avg_delta_idle: number | null;
      avg_completions: number | null;
    };
    const gap =
      stats.avg_delta_active !== null && stats.avg_delta_idle !== null
        ? stats.avg_delta_active - stats.avg_delta_idle
        : null;
    const avgComp = stats.avg_completions ?? 0;
    const suggestedCompletionPer =
      gap === null || avgComp <= 0
        ? null
        : Math.max(
            0,
            Math.min(10, Math.round((gap / Math.max(1, avgComp)) * 10) / 10),
          );
    res.json({
      data: {
        observations: stats,
        suggestedWeights:
          suggestedCompletionPer === null
            ? null
            : { ...V1_WEIGHTS, completionPer: suggestedCompletionPer },
        note:
          stats.users < 10
            ? "Sample too small (<10 users with 2+ scores) — treat as directional only."
            : "Review before applying via PUT /v1/admin/score-config.",
      },
    });
  } catch (err) {
    next(err);
  }
});

aiRouter.get("/kb/search", async (req, res, next) => {
  try {
    const q = z.string().min(1).max(200).parse(req.query.q);
    const limit = z.coerce
      .number()
      .int()
      .min(1)
      .max(20)
      .default(10)
      .parse(req.query.limit);
    const { rows } = await pool.query(
      `SELECT id, title, body, source,
              ts_rank_cd(search_vector, plainto_tsquery('english', $1)) AS rank
         FROM kb_documents
        WHERE status = 'approved'
          AND search_vector @@ plainto_tsquery('english', $1)
        ORDER BY rank DESC LIMIT $2`,
      [q, limit],
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

aiRouter.get("/plans/:id/explanation", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const planRes = await pool.query(
      'SELECT id, user_id AS "userId", items, rationale FROM recovery_plans WHERE id = $1',
      [id],
    );
    if (planRes.rows.length === 0) {
      res
        .status(404)
        .json({ error: { code: "PLAN_NOT_FOUND", message: "No such plan" } });
      return;
    }
    const plan = planRes.rows[0] as {
      userId: number;
      items: unknown[];
      rationale: string;
    };
    const profile = await pool.query(
      'SELECT pain_areas AS "painAreas" FROM profiles WHERE user_id = $1',
      [plan.userId],
    );
    const pains = (profile.rows[0]?.painAreas ?? []) as string[];
    const docs =
      pains.length > 0
        ? (
            await pool.query(
              `SELECT title, source,
                      ts_rank_cd(search_vector, plainto_tsquery('english', $1)) AS rank
                 FROM kb_documents
                WHERE status = 'approved'
                  AND search_vector @@ plainto_tsquery('english', $1)
                ORDER BY rank DESC LIMIT 3`,
              [pains.join(" ")],
            )
          ).rows.map((r) => ({
            title: r.title as string,
            source: r.source as string,
          }))
        : [];
    res.json({
      data: {
        planId: id,
        rationale: plan.rationale,
        ...buildExplanation({
          itemCount: plan.items.length,
          painAreas: pains,
          docs,
        }),
      },
    });
  } catch (err) {
    next(err);
  }
});
