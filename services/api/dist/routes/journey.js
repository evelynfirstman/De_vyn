"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.journeyRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const plan_1 = require("../plan");
exports.journeyRouter = (0, express_1.Router)();
const profileSchema = zod_1.z.object({
    userId: zod_1.z.number().int().positive(),
    goals: zod_1.z.array(zod_1.z.string()).default([]),
    painAreas: zod_1.z.array(zod_1.z.string()).default([]),
    equipment: zod_1.z.array(zod_1.z.string()).default([]),
    minutesPerSession: zod_1.z.number().int().min(5).max(120).default(15),
    daysPerWeek: zod_1.z.number().int().min(1).max(7).default(3),
    occupation: zod_1.z.string().max(120).default(""),
    activityLevel: zod_1.z.string().max(60).default(""),
    productsOwned: zod_1.z.array(zod_1.z.string()).default([]),
});
const assessmentSchema = zod_1.z.object({
    userId: zod_1.z.number().int().positive(),
    soreness: zod_1.z.number().int().min(1).max(5),
    sleepHours: zod_1.z.number().min(0).max(24),
    stress: zod_1.z.number().int().min(1).max(5),
    activity: zod_1.z.string().default(""),
    painAreas: zod_1.z.array(zod_1.z.string()).default([]),
});
const userIdSchema = zod_1.z.object({
    userId: zod_1.z.number().int().positive(),
});
exports.journeyRouter.put("/profiles", async (req, res, next) => {
    try {
        const body = profileSchema.parse(req.body);
        const { rows } = await db_1.pool.query(`INSERT INTO profiles (user_id, goals, pain_areas, equipment, minutes_per_session, days_per_week,
                             occupation, activity_level, products_owned, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
       ON CONFLICT (user_id) DO UPDATE
         SET goals = $2, pain_areas = $3, equipment = $4,
             minutes_per_session = $5, days_per_week = $6,
             occupation = $7, activity_level = $8, products_owned = $9,
             updated_at = now()
       RETURNING user_id AS "userId", goals, pain_areas AS "painAreas",
                 equipment, minutes_per_session AS "minutesPerSession",
                 days_per_week AS "daysPerWeek", occupation,
                 activity_level AS "activityLevel",
                 products_owned AS "productsOwned", updated_at AS "updatedAt"`, [
            body.userId,
            body.goals,
            body.painAreas,
            body.equipment,
            body.minutesPerSession,
            body.daysPerWeek,
            body.occupation,
            body.activityLevel,
            body.productsOwned,
        ]);
        res.json({ data: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.journeyRouter.get("/profiles/:userId", async (req, res, next) => {
    try {
        const userId = zod_1.z.coerce.number().int().positive().parse(req.params.userId);
        const { rows } = await db_1.pool.query(`SELECT user_id AS "userId", goals, pain_areas AS "painAreas",
              equipment, minutes_per_session AS "minutesPerSession",
              days_per_week AS "daysPerWeek", occupation,
              activity_level AS "activityLevel",
              products_owned AS "productsOwned", updated_at AS "updatedAt"
         FROM profiles WHERE user_id = $1`, [userId]);
        if (rows.length === 0) {
            res.status(404).json({
                error: { code: "PROFILE_NOT_FOUND", message: "No profile yet" },
            });
            return;
        }
        res.json({ data: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.journeyRouter.post("/assessments", async (req, res, next) => {
    try {
        const body = assessmentSchema.parse(req.body);
        const { rows } = await db_1.pool.query(`INSERT INTO assessments (user_id, soreness, sleep_hours, stress, activity, pain_areas)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id AS "userId", soreness,
                 sleep_hours AS "sleepHours", stress, activity,
                 pain_areas AS "painAreas", created_at AS "createdAt"`, [
            body.userId,
            body.soreness,
            body.sleepHours,
            body.stress,
            body.activity,
            body.painAreas,
        ]);
        res.status(201).json({ data: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
exports.journeyRouter.post("/plans/generate", async (req, res, next) => {
    try {
        const { userId } = userIdSchema.parse(req.body);
        const plan = await (0, plan_1.generatePlan)(userId);
        res.status(201).json({ data: plan });
    }
    catch (err) {
        next(err);
    }
});
exports.journeyRouter.get("/plans/latest", async (req, res, next) => {
    try {
        const userId = zod_1.z.coerce.number().int().positive().parse(req.query.userId);
        const { rows } = await db_1.pool.query(`SELECT id, user_id AS "userId", assessment_id AS "assessmentId",
              items, rationale, created_at AS "createdAt"
         FROM recovery_plans WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 1`, [userId]);
        if (rows.length === 0) {
            res
                .status(404)
                .json({ error: { code: "PLAN_NOT_FOUND", message: "No plan yet" } });
            return;
        }
        res.json({ data: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=journey.js.map