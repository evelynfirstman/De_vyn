import { env } from "./env";
import { logger } from "./logger";
import {
  pollFulfillmentTracking,
  sweepFulfillmentRetries,
} from "./fulfillment";

/**
 * Fulfillment worker (Phase 7): periodically re-pushes stuck orders to
 * the bridge and pulls tracking back once TeemDrop ships. Single-process
 * by design — the in-flight guard prevents overlapping ticks.
 */
export function startFulfillmentWorker(): void {
  if (env.FULFILLMENT_WORKER !== "true" || env.NODE_ENV === "test") return;
  let running = false;
  const tick = async (): Promise<void> => {
    if (running) return;
    running = true;
    try {
      await sweepFulfillmentRetries();
      await pollFulfillmentTracking();
    } catch (err) {
      logger.warn({ err }, "fulfillment worker tick failed");
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => void tick(), env.FULFILLMENT_POLL_MS);
  timer.unref();
  logger.info(
    { intervalMs: env.FULFILLMENT_POLL_MS },
    "fulfillment worker started",
  );
}
