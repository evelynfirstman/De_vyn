import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

export const adminRouter = Router();

export async function logAudit(
  actor: string,
  action: string,
  entity: string,
  entityId: string,
  diff: unknown,
): Promise<void> {
  await pool.query(
    `INSERT INTO audit_logs (actor, action, entity, entity_id, diff)
     VALUES ($1, $2, $3, $4, $5)`,
    [actor, action, entity, entityId, JSON.stringify(diff ?? {})],
  );
}

/**
 * Audit every admin mutation. Actor locks to real identities when
 * Better Auth + RBAC land (Phase 2b); until then it is labeled dev.
 */
adminRouter.use((req: Request, res: Response, next: NextFunction) => {
  const actor = (req.header("x-admin-actor") ?? "dev-admin").slice(0, 120);
  res.on("finish", () => {
    // NOTE: this router sees every /v1 request (fall-through), so only
    // log actual /admin/* mutations — never user-side writes.
    if (!req.path.startsWith("/admin/")) return;
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
      res.statusCode < 400
    ) {
      const parts = req.path.split("/").filter(Boolean).slice(1);
      const entity = parts[0] ?? "";
      const entityId = parts[1] ?? "";
      logAudit(
        actor,
        `${req.method} ${req.path}`,
        entity,
        entityId,
        req.body ?? {},
      ).catch(() => undefined);
    }
  });
  next();
});

adminRouter.get("/admin/overview", async (_req, res, next) => {
  try {
    const [users, plans, completions, orders, revenue, weekActive] =
      await Promise.all([
        pool.query("SELECT COUNT(*)::int AS total FROM users"),
        pool.query("SELECT COUNT(*)::int AS total FROM recovery_plans"),
        pool.query(
          "SELECT COUNT(*)::int AS total FROM session_completions WHERE completed_at >= (now() - INTERVAL '30 days')",
        ),
        pool.query(
          "SELECT COUNT(*)::int AS total FROM orders WHERE status IN ('paid', 'fulfilled')",
        ),
        pool.query(
          "SELECT COALESCE(SUM(amount_minor), 0)::int AS total FROM orders WHERE status IN ('paid', 'fulfilled')",
        ),
        pool.query(
          "SELECT COUNT(DISTINCT user_id)::int AS total FROM check_ins WHERE check_date >= (CURRENT_DATE - INTERVAL '7 days')",
        ),
      ]);
    res.json({
      data: {
        users: users.rows[0].total,
        plans: plans.rows[0].total,
        completions30d: completions.rows[0].total,
        paidOrders: orders.rows[0].total,
        revenueMinor: revenue.rows[0].total,
        weeklyActive: weekActive.rows[0].total,
      },
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/admin/users", async (req, res, next) => {
  try {
    const q =
      req.query.q === undefined
        ? undefined
        : z.string().min(1).parse(req.query.q);
    const params: string[] = [];
    const clause =
      q === undefined ? "" : "WHERE email ILIKE $1 OR name ILIKE $1";
    if (q !== undefined) params.push(`%${q}%`);
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.name, u.created_at AS "createdAt",
              (SELECT COUNT(*)::int FROM recovery_plans p WHERE p.user_id = u.id) AS plans,
              (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id AND o.status IN ('paid', 'fulfilled')) AS orders
         FROM users u ${clause} ORDER BY u.id ASC LIMIT 100`,
      params,
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/admin/users/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const [user, profile, plan, scores, orders, tickets] = await Promise.all([
      pool.query(
        'SELECT id, email, name, created_at AS "createdAt" FROM users WHERE id = $1',
        [id],
      ),
      pool.query(
        `SELECT goals, pain_areas AS "painAreas", minutes_per_session AS "minutesPerSession",
                days_per_week AS "daysPerWeek" FROM profiles WHERE user_id = $1`,
        [id],
      ),
      pool.query(
        "SELECT items, rationale, created_at FROM recovery_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [id],
      ),
      pool.query(
        "SELECT check_date::text AS date, score, band FROM recovery_scores WHERE user_id = $1 ORDER BY check_date DESC LIMIT 14",
        [id],
      ),
      pool.query(
        "SELECT id, status, amount_minor, currency, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
        [id],
      ),
      pool.query(
        "SELECT id, subject, status, created_at FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
        [id],
      ),
    ]);
    if (user.rows.length === 0) {
      res
        .status(404)
        .json({ error: { code: "USER_NOT_FOUND", message: "No such user" } });
      return;
    }
    res.json({
      data: {
        user: user.rows[0],
        profile: profile.rows[0] ?? null,
        latestPlan: plan.rows[0] ?? null,
        scores: scores.rows,
        orders: orders.rows,
        tickets: tickets.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});
