import { Router } from "express";
import { checkDb } from "../db";
import { checkRedis } from "../redis";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  const [db, redisOk] = await Promise.all([checkDb(), checkRedis()]);
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
