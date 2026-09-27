import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./db";
import { logger } from "./logger";

/**
 * Minimal ordered migration runner (Phase 2/3).
 * Applies *.sql from services/api/migrations exactly once,
 * tracked in schema_migrations. Runs on API boot.
 */
export async function migrate(): Promise<void> {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
  );
  const dir = path.join(__dirname, "..", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const applied = new Set(
    (await pool.query("SELECT name FROM schema_migrations")).rows.map(
      (r) => r.name as string,
    ),
  );
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(dir, file), "utf8");
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        file,
      ]);
      await pool.query("COMMIT");
      logger.info({ migration: file }, "migration applied");
    } catch (err) {
      await pool.query("ROLLBACK");
      throw err;
    }
  }
}
