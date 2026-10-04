import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

export const authLinkRouter = Router();

/**
 * Link a Better Auth identity to an app row (Phase 2b).
 * Called once after sign-up/sign-in; all journey endpoints keep
 * using the numeric app user id. No auth required (email is the key).
 */
authLinkRouter.post("/auth/link", async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        name: z.string().min(1).max(120).default(""),
      })
      .parse(req.body);
    const email = body.email.toLowerCase();
    const existing = await pool.query(
      "SELECT id FROM users WHERE lower(email) = $1",
      [email],
    );
    if (existing.rows.length > 0) {
      res.json({ data: { appUserId: existing.rows[0].id as number } });
      return;
    }
    const created = await pool.query(
      "INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id",
      [email, body.name],
    );
    res.status(201).json({ data: { appUserId: created.rows[0].id as number } });
  } catch (err) {
    next(err);
  }
});
