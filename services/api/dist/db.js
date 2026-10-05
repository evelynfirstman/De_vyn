"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.checkDb = checkDb;
const pg_1 = require("pg");
const env_1 = require("./env");
const logger_1 = require("./logger");
exports.pool = new pg_1.Pool({ connectionString: env_1.env.DATABASE_URL });
exports.pool.on("error", (err) => {
    logger_1.logger.error({ err }, "pg pool error");
});
async function checkDb() {
    try {
        await exports.pool.query("SELECT 1");
        return true;
    }
    catch (err) {
        logger_1.logger.warn({ err }, "db check failed");
        return false;
    }
}
//# sourceMappingURL=db.js.map