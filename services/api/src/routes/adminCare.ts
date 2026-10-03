import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

export const adminCareRouter = Router();

// ---------- AI KB review queue ----------
const kbSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().default(""),
  source: z.string().default(""),
  status: z.enum(["draft", "approved", "rejected"]).default("draft"),
});

const KB_COLUMNS = `id, title, body, source, status, created_at AS "createdAt"`;

adminCareRouter.get("/admin/kb", async (req, res, next) => {
  try {
    const status =
      req.query.status === undefined
        ? undefined
        : z.enum(["draft", "approved", "rejected"]).parse(req.query.status);
    const params: string[] = [];
    const clause = status === undefined ? "" : "WHERE status = $1";
    if (status !== undefined) params.push(status);
    const { rows } = await pool.query(
      `SELECT ${KB_COLUMNS} FROM kb_documents ${clause} ORDER BY created_at DESC`,
      params,
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

adminCareRouter.post("/admin/kb", async (req, res, next) => {
  try {
    const body = kbSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO kb_documents (title, body, source, status)
       VALUES ($1, $2, $3, $4) RETURNING ${KB_COLUMNS}`,
      [body.title, body.body, body.source, body.status],
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

adminCareRouter.post("/admin/kb/:id/review", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const { status } = z
      .object({ status: z.enum(["approved", "rejected"]) })
      .parse(req.body);
    const { rows } = await pool.query(
      `UPDATE kb_documents SET status = $2 WHERE id = $1 RETURNING ${KB_COLUMNS}`,
      [id, status],
    );
    if (rows.length === 0) {
      res
        .status(404)
        .json({ error: { code: "KB_NOT_FOUND", message: "No such document" } });
      return;
    }
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

adminCareRouter.delete("/admin/kb/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const { rowCount } = await pool.query(
      "DELETE FROM kb_documents WHERE id = $1",
      [id],
    );
    if (rowCount === 0) {
      res
        .status(404)
        .json({ error: { code: "KB_NOT_FOUND", message: "No such document" } });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---------- Support tickets ----------
adminCareRouter.get("/admin/tickets", async (req, res, next) => {
  try {
    const status =
      req.query.status === undefined
        ? undefined
        : z.enum(["open", "resolved"]).parse(req.query.status);
    const params: string[] = [];
    const clause = status === undefined ? "" : "WHERE t.status = $1";
    if (status !== undefined) params.push(status);
    const { rows } = await pool.query(
      `SELECT t.id, t.user_id AS "userId", u.email, t.subject, t.message,
              t.status, t.created_at AS "createdAt"
         FROM support_tickets t JOIN users u ON u.id = t.user_id
        ${clause} ORDER BY t.created_at DESC LIMIT 100`,
      params,
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

adminCareRouter.post("/tickets", async (req, res, next) => {
  try {
    const body = z
      .object({
        userId: z.number().int().positive(),
        subject: z.string().min(1).max(200),
        message: z.string().default(""),
      })
      .parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO support_tickets (user_id, subject, message)
       VALUES ($1, $2, $3)
       RETURNING id, user_id AS "userId", subject, message, status,
                 created_at AS "createdAt"`,
      [body.userId, body.subject, body.message],
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

adminCareRouter.post("/admin/tickets/:id/resolve", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const { rows } = await pool.query(
      `UPDATE support_tickets SET status = 'resolved' WHERE id = $1
       RETURNING id, status`,
      [id],
    );
    if (rows.length === 0) {
      res.status(404).json({
        error: { code: "TICKET_NOT_FOUND", message: "No such ticket" },
      });
      return;
    }
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ---------- Notifications (send + history) ----------
adminCareRouter.post("/admin/notifications", async (req, res, next) => {
  try {
    const body = z
      .object({
        userId: z.number().int().positive().optional(),
        broadcast: z.boolean().default(false),
        title: z.string().min(1).max(200),
        body: z.string().default(""),
      })
      .parse(req.body);
    let count = 0;
    if (body.broadcast) {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, kind, title, body)
         SELECT id, 'campaign', $1, $2 FROM users`,
        [body.title, body.body],
      );
      count = result.rowCount ?? 0;
    } else {
      if (body.userId === undefined) {
        res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "userId or broadcast required",
          },
        });
        return;
      }
      await pool.query(
        `INSERT INTO notifications (user_id, kind, title, body)
         VALUES ($1, 'manual', $2, $3)`,
        [body.userId, body.title, body.body],
      );
      count = 1;
    }
    res.status(201).json({ data: { sent: count } });
  } catch (err) {
    next(err);
  }
});

adminCareRouter.get("/admin/notifications", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT n.id, n.user_id AS "userId", u.email, n.kind, n.title,
              n.read, n.created_at AS "createdAt"
         FROM notifications n JOIN users u ON u.id = n.user_id
        ORDER BY n.created_at DESC LIMIT 100`,
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// ---------- QR codes (list + revoke; create lives in shop.ts) ----------
adminCareRouter.get("/admin/qr", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, kind, ref, code, scans, created_at AS "createdAt"
         FROM qr_codes ORDER BY created_at DESC`,
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

adminCareRouter.delete("/admin/qr/:code", async (req, res, next) => {
  try {
    const code = z.string().min(1).parse(req.params.code);
    const { rowCount } = await pool.query(
      "DELETE FROM qr_codes WHERE code = $1",
      [code],
    );
    if (rowCount === 0) {
      res
        .status(404)
        .json({ error: { code: "QR_NOT_FOUND", message: "Unknown code" } });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
