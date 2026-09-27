import { Pool } from "pg";
import { env } from "./env";
import { logger } from "./logger";

export const pool = new Pool({ connectionString: env.DATABASE_URL });

pool.on("error", (err) => {
  logger.error({ err }, "pg pool error");
});

export async function checkDb(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (err) {
    logger.warn({ err }, "db check failed");
    return false;
  }
}
