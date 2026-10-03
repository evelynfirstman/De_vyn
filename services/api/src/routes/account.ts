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

/**
 * Export everything held about a user (GDPR-style access, Phase 12).
 * Financial records are included (read-only) with a retention note.
 */
accountRouter.get("/users/:id/export", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.params.id);
    const user = await pool.query(
      'SELECT id, email, name, created_at AS "createdAt" FROM users WHERE id = $1',
      [userId],
    );
    if (user.rows.length === 0) {
      res
        .status(404)
        .json({ error: { code: "USER_NOT_FOUND", message: "No such user" } });
      return;
    }
    const tables = [
      "profiles",
      "assessments",
      "recovery_plans",
      "check_ins",
      "recovery_scores",
      "session_completions",
      "goals",
      "bookmarks",
      "milestones",
      "notifications",
      "notification_prefs",
      "subscriptions",
      "orders",
    ];
    const data: Record<string, unknown> = { user: user.rows[0] };
    for (const table of tables) {
      const rows = await pool.query(
        `SELECT * FROM ${table} WHERE user_id = $1 ORDER BY 1`,
        [userId],
      );
      data[table] = rows.rows;
    }
    const referrals = await pool.query(
      "SELECT * FROM referrals WHERE referrer_user_id = $1 OR referred_user_id = $1 ORDER BY 1",
      [userId],
    );
    data.referrals = referrals.rows;
    const items = await pool.query(
      `SELECT i.* FROM order_items i JOIN orders o ON o.id = i.order_id
        WHERE o.user_id = $1 ORDER BY 1`,
      [userId],
    );
    data.order_items = items.rows;
    res.json({
      data: {
        ...data,
        _retentionNote:
          "Financial records (orders, payments, subscriptions) are retained for tax/audit purposes.",
      },
    });
  } catch (err) {
    next(err);
  }
});
