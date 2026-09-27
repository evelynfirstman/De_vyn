import Redis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

redis.on("error", (err) => {
  logger.warn({ err }, "redis error");
});

export async function checkRedis(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (err) {
    logger.warn({ err }, "redis check failed");
    return false;
  }
}
