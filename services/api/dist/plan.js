"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePlan = generatePlan;
const db_1 = require("./db");
const errors_1 = require("./errors");
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/**
 * Recovery plan generator v1 — deterministic rules (Phase 3).
 *
 * Rules (weights documented for later calibration in Phase 10):
 * 1. sessions/week = profile.daysPerWeek (default 3)
 * 2. session length cap = profile.minutesPerSession (default 15)
 * 3. pick programs with duration_min <= cap, longest-first
 *    (more recovery value per session); fall back to the
 *    shortest program when nothing fits the cap
 * 4. spread sessions across the week starting Monday
 * 5. rationale string records the inputs so v2 can learn from them
 */
async function generatePlan(userId) {
    const profileRes = await db_1.pool.query(`SELECT minutes_per_session AS "minutesPerSession",
            days_per_week AS "daysPerWeek",
            pain_areas AS "painAreas"
       FROM profiles WHERE user_id = $1`, [userId]);
    if (profileRes.rows.length === 0) {
        throw new errors_1.ApiError(404, "PROFILE_NOT_FOUND", "Complete your profile first");
    }
    const profile = profileRes.rows[0];
    const assessmentRes = await db_1.pool.query("SELECT id FROM assessments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]);
    if (assessmentRes.rows.length === 0) {
        throw new errors_1.ApiError(404, "ASSESSMENT_NOT_FOUND", "Complete an assessment first");
    }
    const assessmentId = assessmentRes.rows[0].id;
    const days = Math.max(1, Math.min(7, profile.daysPerWeek));
    const cap = Math.max(5, profile.minutesPerSession);
    const fitRes = await db_1.pool.query("SELECT id, slug, title, duration_min FROM programs WHERE duration_min <= $1 ORDER BY duration_min DESC LIMIT $2", [cap, days]);
    let programs = fitRes.rows;
    if (programs.length === 0) {
        const fallback = await db_1.pool.query("SELECT id, slug, title, duration_min FROM programs ORDER BY duration_min ASC LIMIT 1");
        programs = fallback.rows;
    }
    if (programs.length === 0) {
        throw new errors_1.ApiError(409, "NO_PROGRAMS", "No programs available to build a plan");
    }
    const items = Array.from({ length: days }, (_, i) => {
        const program = programs[i % programs.length];
        return {
            day: WEEKDAYS[i],
            programId: program.id,
            slug: program.slug,
            title: program.title,
            durationMin: program.duration_min,
        };
    });
    const rationale = `v1 rules: ${days} sessions/week, cap ${cap} min/session, ` +
        `pain areas [${profile.painAreas.join(", ") || "none stated"}], ` +
        `assessment #${assessmentId}, longest-fitting programs first.`;
    const inserted = await db_1.pool.query(`INSERT INTO recovery_plans (user_id, assessment_id, items, rationale)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id AS "userId", assessment_id AS "assessmentId",
               items, rationale, created_at AS "createdAt"`, [userId, assessmentId, JSON.stringify(items), rationale]);
    return inserted.rows[0];
}
//# sourceMappingURL=plan.js.map