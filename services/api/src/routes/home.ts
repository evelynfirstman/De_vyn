import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { redis } from "../redis";
import { logger } from "../logger";
import { computeScoreV1 } from "../score";
import { evaluateMilestones } from "../milestones";
import {
  dayBefore,
  displayStreak,
  nextStreak,
  weekdayName,
  type StreakState,
} from "../streak";

export const homeRouter = Router();

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
  .refine((d) => !Number.isNaN(new Date(`${d}T12:00:00Z`).getTime()), {
    message: "date is not a real calendar day",
  });

const checkInSchema = z.object({
  userId: z.number().int().positive(),
  date: dateSchema,
  soreness: z.number().int().min(1).max(5),
  sleepHours: z.number().min(0).max(24),
  stress: z.number().int().min(1).max(5),
  activity: z.string().default(""),
  timezone: z.string().default("UTC"),
});

function streakKey(userId: number): string {
  return `streak:${userId}`;
}

/** Sessions completed in the 7 days ending on `date` (score bonus input). */
async function countCompletionsLast7Days(
  userId: number,
  date: string,
): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM session_completions
      WHERE user_id = $1 AND completed_at >= ($2::date - INTERVAL '6 days')`,
    [userId, date],
  );
  return rows[0].total as number;
}

/** Rebuild streak state from Postgres when Redis is unavailable. */
async function rebuildStreak(
  userId: number,
  today: string,
): Promise<StreakState | null> {
  const { rows } = await pool.query(
    "SELECT check_date::text AS check_date FROM check_ins WHERE user_id = $1 AND check_date <= $2 ORDER BY check_date DESC LIMIT 120",
    [userId, today],
  );
  const dates = rows.map((r) => r.check_date as string);
  if (dates.length === 0) return null;
  if (dates[0] !== today && dates[0] !== dayBefore(today)) return null;
  let cursor = dates[0];
  let count = 0;
  for (const d of dates) {
    if (d !== cursor) break;
    count += 1;
    cursor = dayBefore(cursor);
  }
  return { count, lastDate: dates[0] };
}

export async function readStreak(
  userId: number,
  today: string,
): Promise<StreakState | null> {
  try {
    const raw = await redis.get(streakKey(userId));
    if (!raw) return rebuildStreak(userId, today);
    return JSON.parse(raw) as StreakState;
  } catch (err) {
    logger.warn({ err }, "streak read fell back to postgres");
    return rebuildStreak(userId, today);
  }
}

async function writeStreak(userId: number, state: StreakState): Promise<void> {
  try {
    await redis.set(streakKey(userId), JSON.stringify(state));
  } catch (err) {
    logger.warn(
      { err },
      "streak write to redis failed (db remains source of truth)",
    );
  }
}

homeRouter.post("/check-ins", async (req, res, next) => {
  try {
    const body = checkInSchema.parse(req.body);

    const checkIn = (
      await pool.query(
        `INSERT INTO check_ins (user_id, check_date, soreness, sleep_hours, stress, activity, timezone)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id, check_date) DO UPDATE
           SET soreness = $3, sleep_hours = $4, stress = $5,
               activity = $6, timezone = $7
         RETURNING id, user_id AS "userId", check_date::text AS "date",
                   soreness, sleep_hours AS "sleepHours", stress, activity, timezone`,
        [
          body.userId,
          body.date,
          body.soreness,
          body.sleepHours,
          body.stress,
          body.activity,
          body.timezone,
        ],
      )
    ).rows[0];

    const completions = await countCompletionsLast7Days(body.userId, body.date);
    const result = computeScoreV1({
      soreness: body.soreness,
      sleepHours: body.sleepHours,
      stress: body.stress,
      completionsLast7Days: completions,
    });

    const score = (
      await pool.query(
        `INSERT INTO recovery_scores (user_id, check_date, score, band, inputs)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, check_date) DO UPDATE
           SET score = $3, band = $4, inputs = $5
         RETURNING user_id AS "userId", check_date::text AS "date",
                   score, band, inputs`,
        [
          body.userId,
          body.date,
          result.score,
          result.band,
          JSON.stringify({
            soreness: body.soreness,
            sleepHours: body.sleepHours,
            stress: body.stress,
            completionsLast7Days: completions,
            breakdown: result.breakdown,
          }),
        ],
      )
    ).rows[0];

    const prev = await readStreak(body.userId, body.date);
    const streak = nextStreak(prev, body.date);
    await writeStreak(body.userId, streak);
    const milestones = await evaluateMilestones(body.userId);

    res.status(201).json({ data: { checkIn, score, streak, milestones } });
  } catch (err) {
    next(err);
  }
});

homeRouter.get("/home", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.query.userId);
    const date =
      req.query.date === undefined
        ? new Date().toISOString().slice(0, 10)
        : dateSchema.parse(req.query.date);
    const weekday = weekdayName(date);

    const planRes = await pool.query(
      "SELECT items FROM recovery_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [userId],
    );
    const items = (planRes.rows[0]?.items ?? []) as {
      day: string;
      title: string;
    }[];
    const todaySession = items.find((i) => i.day === weekday) ?? null;

    const scoreRes = await pool.query(
      `SELECT user_id AS "userId", check_date::text AS "date", score, band, inputs
         FROM recovery_scores WHERE user_id = $1
         ORDER BY check_date DESC LIMIT 1`,
      [userId],
    );

    const checkInRes = await pool.query(
      `SELECT id, user_id AS "userId", check_date::text AS "date",
              soreness, sleep_hours AS "sleepHours", stress, activity, timezone
         FROM check_ins WHERE user_id = $1 AND check_date = $2`,
      [userId, date],
    );

    const state = await readStreak(userId, date);

    res.json({
      data: {
        date,
        weekday,
        todaySession,
        score: scoreRes.rows[0] ?? null,
        streak: {
          count: displayStreak(state, date),
          lastDate: state?.lastDate ?? null,
        },
        checkIn: checkInRes.rows[0] ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});
