"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const db_1 = require("./db");
const logger_1 = require("./logger");
/**
 * Minimal ordered migration runner (Phase 2/3).
 * Applies *.sql from services/api/migrations exactly once,
 * tracked in schema_migrations. Runs on API boot.
 */
async function migrate() {
    await db_1.pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
    const dir = node_path_1.default.join(__dirname, "..", "migrations");
    const files = (await (0, promises_1.readdir)(dir)).filter((f) => f.endsWith(".sql")).sort();
    const applied = new Set((await db_1.pool.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name));
    for (const file of files) {
        if (applied.has(file))
            continue;
        const sql = await (0, promises_1.readFile)(node_path_1.default.join(dir, file), "utf8");
        await db_1.pool.query("BEGIN");
        try {
            await db_1.pool.query(sql);
            await db_1.pool.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
                file,
            ]);
            await db_1.pool.query("COMMIT");
            logger_1.logger.info({ migration: file }, "migration applied");
        }
        catch (err) {
            await db_1.pool.query("ROLLBACK");
            throw err;
        }
    }
}
//# sourceMappingURL=migrate.js.map