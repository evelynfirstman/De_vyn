import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

export const accountRouter = Router();

/**
 * Delete a user's activity data (GDPR-style erasure, Phase 8).
 * Financial records (orders, payments, fulfillment) are retained —
 * money trails must survive account deletion.
 */
accountRouter.delete("/users/:id/data", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.params.id);
    const found = await pool.query("SELECT id FROM users WHERE id = $1", [
      userId,
    ]);
    if (found.rows.length === 0) {
      res
        .status(404)
        .json({ error: { code: "USER_NOT_FOUND", message: "No such user" } });
      return;
    }
    await pool.query("BEGIN");
    try {
      for (const table of [
        "notifications",
        "milestones",
        "goals",
        "bookmarks",
        "recovery_scores",
        "check_ins",
        "recovery_plans",
        "assessments",
        "session_completions",
        "profiles",
      ]) {
        await pool.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
      }
      await pool.query("COMMIT");
    } catch (err) {
      await pool.query("ROLLBACK");
      throw err;
    }
    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});
