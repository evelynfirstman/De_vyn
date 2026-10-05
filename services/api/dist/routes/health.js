"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const redis_1 = require("../redis");
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get("/", async (_req, res) => {
    const [db, redisOk] = await Promise.all([(0, db_1.checkDb)(), (0, redis_1.checkRedis)()]);
    const ok = db && redisOk;
    res.status(ok ? 200 : 503).json({
        status: ok ? "ok" : "degraded",
        checks: {
            db: db ? "up" : "down",
            redis: redisOk ? "up" : "down",
        },
        version: "0.1.0",
    });
});
//# sourceMappingURL=health.js.map