import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { generatePlan } from "../plan";

export const journeyRouter = Router();

const profileSchema = z.object({
  userId: z.number().int().positive(),
  goals: z.array(z.string()).default([]),
  painAreas: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  minutesPerSession: z.number().int().min(5).max(120).default(15),
  daysPerWeek: z.number().int().min(1).max(7).default(3),
});

const assessmentSchema = z.object({
  userId: z.number().int().positive(),
  soreness: z.number().int().min(1).max(5),
  sleepHours: z.number().min(0).max(24),
  stress: z.number().int().min(1).max(5),
  activity: z.string().default(""),
  painAreas: z.array(z.string()).default([]),
});

const userIdSchema = z.object({
  userId: z.number().int().positive(),
});

journeyRouter.put("/profiles", async (req, res, next) => {
  try {
    const body = profileSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO profiles (user_id, goals, pain_areas, equipment, minutes_per_session, days_per_week, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (user_id) DO UPDATE
         SET goals = $2, pain_areas = $3, equipment = $4,
             minutes_per_session = $5, days_per_week = $6, updated_at = now()
       RETURNING user_id AS "userId", goals, pain_areas AS "painAreas",
                 equipment, minutes_per_session AS "minutesPerSession",
                 days_per_week AS "daysPerWeek", updated_at AS "updatedAt"`,
      [
        body.userId,
        body.goals,
        body.painAreas,
        body.equipment,
        body.minutesPerSession,
        body.daysPerWeek,
      ],
    );
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

journeyRouter.get("/profiles/:userId", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.params.userId);
    const { rows } = await pool.query(
      `SELECT user_id AS "userId", goals, pain_areas AS "painAreas",
              equipment, minutes_per_session AS "minutesPerSession",
              days_per_week AS "daysPerWeek", updated_at AS "updatedAt"
         FROM profiles WHERE user_id = $1`,
      [userId],
    );
    if (rows.length === 0) {
      res.status(404).json({
        error: { code: "PROFILE_NOT_FOUND", message: "No profile yet" },
      });
      return;
    }
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

journeyRouter.post("/assessments", async (req, res, next) => {
  try {
    const body = assessmentSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO assessments (user_id, soreness, sleep_hours, stress, activity, pain_areas)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id AS "userId", soreness,
                 sleep_hours AS "sleepHours", stress, activity,
                 pain_areas AS "painAreas", created_at AS "createdAt"`,
      [
        body.userId,
        body.soreness,
        body.sleepHours,
        body.stress,
        body.activity,
        body.painAreas,
      ],
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

journeyRouter.post("/plans/generate", async (req, res, next) => {
  try {
    const { userId } = userIdSchema.parse(req.body);
    const plan = await generatePlan(userId);
    res.status(201).json({ data: plan });
  } catch (err) {
    next(err);
  }
});

journeyRouter.get("/plans/latest", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.query.userId);
    const { rows } = await pool.query(
      `SELECT id, user_id AS "userId", assessment_id AS "assessmentId",
              items, rationale, created_at AS "createdAt"
         FROM recovery_plans WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    if (rows.length === 0) {
      res
        .status(404)
        .json({ error: { code: "PLAN_NOT_FOUND", message: "No plan yet" } });
      return;
    }
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});
