import { randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

export const growthRouter = Router();

growthRouter.get("/subscriptions/plans", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, amount_minor AS "amountMinor", currency, interval
         FROM subscription_plans ORDER BY amount_minor ASC`,
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

growthRouter.post("/subscriptions/checkout", async (req, res, next) => {
  try {
    const body = z
      .object({
        userId: z.number().int().positive(),
        planId: z.number().int().positive(),
      })
      .parse(req.body);
    const plan = await pool.query(
      `SELECT id, name, amount_minor AS "amountMinor", currency, interval
         FROM subscription_plans WHERE id = $1`,
      [body.planId],
    );
    if (plan.rows.length === 0) {
      res.status(404).json({
        error: { code: "PLAN_NOT_FOUND", message: "No such subscription plan" },
      });
      return;
    }
    const txRef = `SUB-${Date.now()}-${randomBytes(4).toString("hex")}`;
    const { rows } = await pool.query(
      `INSERT INTO subscriptions (user_id, plan_id, status, tx_ref)
       VALUES ($1, $2, 'pending', $3)
       RETURNING id, user_id AS "userId", plan_id AS "planId",
                 status, tx_ref AS "txRef", created_at AS "createdAt"`,
      [body.userId, body.planId, txRef],
    );
    // Recurring charge itself is completed via Flutterwave (live keys);
    // activation happens in the payments webhook on tx_ref match.
    res.status(201).json({ data: { ...rows[0], plan: plan.rows[0] } });
  } catch (err) {
    next(err);
  }
});

growthRouter.get("/entitlements", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.query.userId);
    const { rows } = await pool.query(
      `SELECT s.id, s.status, p.name AS "planName"
         FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id
        WHERE s.user_id = $1 AND s.status = 'active'
        ORDER BY s.created_at DESC LIMIT 1`,
      [userId],
    );
    res.json({
      data: {
        premium: rows.length > 0,
        subscription: rows[0] ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});

growthRouter.get("/users/:id/prefs", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.params.id);
    const { rows } = await pool.query(
      `SELECT user_id AS "userId", promos, reminders,
              reminder_time AS "reminderTime"
         FROM notification_prefs WHERE user_id = $1`,
      [userId],
    );
    res.json({
      data: rows[0] ?? {
        userId,
        promos: true,
        reminders: true,
        reminderTime: "08:00",
      },
    });
  } catch (err) {
    next(err);
  }
});

growthRouter.put("/users/:id/prefs", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.params.id);
    const body = z
      .object({
        promos: z.boolean().optional(),
        reminders: z.boolean().optional(),
        reminderTime: z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM")
          .optional(),
      })
      .parse(req.body);
    const current = (
      await pool.query(
        "SELECT promos, reminders, reminder_time FROM notification_prefs WHERE user_id = $1",
        [userId],
      )
    ).rows[0] as
      | { promos: boolean; reminders: boolean; reminder_time: string }
      | undefined;
    const promos = body.promos ?? current?.promos ?? true;
    const reminders = body.reminders ?? current?.reminders ?? true;
    const reminderTime = body.reminderTime ?? current?.reminder_time ?? "08:00";
    const { rows } = await pool.query(
      `INSERT INTO notification_prefs (user_id, promos, reminders, reminder_time, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (user_id) DO UPDATE
         SET promos = $2, reminders = $3, reminder_time = $4, updated_at = now()
       RETURNING user_id AS "userId", promos, reminders,
                 reminder_time AS "reminderTime"`,
      [userId, promos, reminders, reminderTime],
    );
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * Replenishment nudges (Phase 11): users with a paid order 30+ days old,
 * promo-opted-in, and not nudged in the last 30 days.
 */
growthRouter.post("/admin/nudges/replenishment", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT o.user_id AS "userId"
         FROM orders o
         LEFT JOIN notification_prefs p ON p.user_id = o.user_id
        WHERE o.status IN ('paid', 'fulfilled')
          AND o.created_at < (now() - INTERVAL '30 days')
          AND COALESCE(p.promos, true) = true
          AND NOT EXISTS (
            SELECT 1 FROM notifications n
             WHERE n.user_id = o.user_id AND n.kind = 'replenishment'
               AND n.created_at > (now() - INTERVAL '30 days')
          )`,
    );
    for (const r of rows as { userId: number }[]) {
      await pool.query(
        `INSERT INTO notifications (user_id, kind, title, body)
         VALUES ($1, 'replenishment', 'Running low?', $2)`,
        [
          r.userId,
          "Your last recovery order was over a month ago — restock the essentials.",
        ],
      );
    }
    res.status(201).json({ data: { notified: rows.length } });
  } catch (err) {
    next(err);
  }
});

function newReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

growthRouter.post("/referrals", async (req, res, next) => {
  try {
    const { userId } = z
      .object({ userId: z.number().int().positive() })
      .parse(req.body);
    const existing = await pool.query(
      "SELECT code, status FROM referrals WHERE referrer_user_id = $1 AND referred_user_id IS NULL ORDER BY id DESC LIMIT 1",
      [userId],
    );
    if (existing.rows.length > 0) {
      res.json({ data: existing.rows[0] });
      return;
    }
    const { rows } = await pool.query(
      `INSERT INTO referrals (referrer_user_id, code, status)
       VALUES ($1, $2, 'open') RETURNING code, status`,
      [userId, newReferralCode()],
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

growthRouter.post("/referrals/redeem", async (req, res, next) => {
  try {
    const body = z
      .object({ code: z.string().min(1), userId: z.number().int().positive() })
      .parse(req.body);
    const found = await pool.query(
      'SELECT id, referrer_user_id AS "referrerUserId", referred_user_id AS "referredUserId" FROM referrals WHERE code = $1',
      [body.code.toUpperCase()],
    );
    if (found.rows.length === 0) {
      res.status(404).json({
        error: { code: "CODE_NOT_FOUND", message: "Unknown referral code" },
      });
      return;
    }
    const row = found.rows[0] as {
      id: number;
      referrerUserId: number;
      referredUserId: number | null;
    };
    if (row.referrerUserId === body.userId) {
      res.status(409).json({
        error: {
          code: "SELF_REFERRAL",
          message: "You cannot redeem your own code",
        },
      });
      return;
    }
    if (row.referredUserId !== null) {
      res.status(409).json({
        error: { code: "ALREADY_REDEEMED", message: "Code already used" },
      });
      return;
    }
    await pool.query(
      "UPDATE referrals SET referred_user_id = $2, status = 'redeemed' WHERE id = $1",
      [row.id, body.userId],
    );
    res.json({ data: { redeemed: true } });
  } catch (err) {
    next(err);
  }
});

growthRouter.get("/referrals", async (req, res, next) => {
  try {
    const userId = z.coerce.number().int().positive().parse(req.query.userId);
    const [mine, referredBy] = await Promise.all([
      pool.query(
        "SELECT code, status FROM referrals WHERE referrer_user_id = $1 ORDER BY id DESC",
        [userId],
      ),
      pool.query("SELECT code FROM referrals WHERE referred_user_id = $1", [
        userId,
      ]),
    ]);
    res.json({ data: { mine: mine.rows, referredBy: referredBy.rows } });
  } catch (err) {
    next(err);
  }
});
