import { Router } from "express";
import { pool } from "../db";
import { pageEnvelope, parsePagination } from "../pagination";

export const catalogRouter = Router();

type CatalogTable = "programs" | "articles" | "products";

async function list(table: CatalogTable, page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM ${table}`),
  ]);
  return pageEnvelope(rows.rows, count.rows[0].total as number, page, pageSize);
}

catalogRouter.get("/programs", async (req, res, next) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    res.json(await list("programs", page, pageSize));
  } catch (err) {
    next(err);
  }
});

catalogRouter.get("/articles", async (req, res, next) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    res.json(await list("articles", page, pageSize));
  } catch (err) {
    next(err);
  }
});

catalogRouter.get("/products", async (req, res, next) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    res.json(await list("products", page, pageSize));
  } catch (err) {
    next(err);
  }
});
