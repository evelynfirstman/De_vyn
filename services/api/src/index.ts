import cors from "cors";
import express from "express";
import { env } from "./env";
import { logger } from "./logger";
import { migrate } from "./migrate";
import { errorHandler, notFound } from "./errors";
import { healthRouter } from "./routes/health";
import { catalogRouter } from "./routes/catalog";
import { journeyRouter } from "./routes/journey";

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, "request");
  next();
});

app.use("/health", healthRouter);
app.use("/v1", catalogRouter);
app.use("/v1", journeyRouter);
app.use(notFound);
app.use(errorHandler);

async function main(): Promise<void> {
  await migrate();
  const server = app.listen(env.PORT, () => {
    logger.info(`api listening on :${env.PORT}`);
  });

  function shutdown(signal: string): void {
    logger.info(`${signal} received, closing`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error({ err }, "api startup failed");
  process.exit(1);
});
