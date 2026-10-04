import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { env } from "../env";
import {
  buildCoachMessages,
  callGroq,
  COACH_FALLBACK,
  keywordQuery,
  scanReply,
  type CoachContext,
  type CoachMessage,
} from "../coach";

export const coachRouter = Router();

const chatSchema = z.object({
  userId: z.number().int().positive(),
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .max(20)
    .default([]),
});

coachRouter.post("/coach/chat", async (req, res, next) => {
  try {
    if (!env.GROQ_API_KEY) {
      res.status(503).json({
        error: { code: "AI_UNCONFIGURED", message: "Coach API key not set" },
      });
      return;
    }
    const body = chatSchema.parse(req.body);

    const kbQuery = keywordQuery(body.message);
    const [profileRes, planRes, scoresRes, kbRes] = await Promise.all([
      pool.query(
        `SELECT name, goals, pain_areas AS "painAreas",
                minutes_per_session AS "minutesPerSession",
                days_per_week AS "daysPerWeek"
           FROM users u LEFT JOIN profiles p ON p.user_id = u.id
          WHERE u.id = $1`,
        [body.userId],
      ),
      pool.query(
        "SELECT items, rationale FROM recovery_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [body.userId],
      ),
      pool.query(
        "SELECT check_date::text AS date, score, band FROM recovery_scores WHERE user_id = $1 ORDER BY check_date DESC LIMIT 5",
        [body.userId],
      ),
      kbQuery === null
        ? Promise.resolve({ rows: [] })
        : pool.query(
            `SELECT title, body, source,
                    ts_rank_cd(search_vector, to_tsquery('english', $1)) AS rank
               FROM kb_documents
              WHERE status = 'approved'
                AND search_vector @@ to_tsquery('english', $1)
              ORDER BY rank DESC LIMIT 3`,
            [kbQuery],
          ),
    ]);
    if (profileRes.rows.length === 0) {
      res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "No such user" },
      });
      return;
    }

    const profile = profileRes.rows[0] as {
      name: string | null;
      goals: string[] | null;
      painAreas: string[] | null;
      minutesPerSession: number | null;
      daysPerWeek: number | null;
    };
    const plan = planRes.rows[0] as
      | { items: { day: string; title: string }[]; rationale: string }
      | undefined;
    const ctx: CoachContext = {
      name: profile.name ?? "",
      goals: profile.goals ?? [],
      painAreas: profile.painAreas ?? [],
      minutesPerSession: profile.minutesPerSession ?? 15,
      daysPerWeek: profile.daysPerWeek ?? 3,
      planSummary: plan
        ? plan.items.map((i) => `${i.day}: ${i.title}`).join("; ")
        : "",
      recentScores: scoresRes.rows as CoachContext["recentScores"],
      kbExcerpts: kbRes.rows as CoachContext["kbExcerpts"],
    };

    const history: CoachMessage[] = body.history.map((h) => ({
      role: h.role,
      content: h.content,
    }));
    const reply = await callGroq(
      env.GROQ_API_KEY,
      env.GROQ_MODEL,
      buildCoachMessages(ctx, history, body.message),
    );
    const flagged = scanReply(reply);
    res.json({
      data: {
        reply: flagged.length > 0 ? COACH_FALLBACK : reply,
        flagged: flagged.length > 0,
        model: env.GROQ_MODEL,
        sources: ctx.kbExcerpts.map((d) => ({
          title: d.title,
          source: d.source,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});
