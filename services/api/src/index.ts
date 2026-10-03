import cors from "cors";
import express from "express";
import { env } from "./env";
import { logger } from "./logger";
import { migrate } from "./migrate";
import { errorHandler, notFound } from "./errors";
import { healthRouter } from "./routes/health";
import { catalogRouter } from "./routes/catalog";
import { journeyRouter } from "./routes/journey";
import { homeRouter } from "./routes/home";
import { sessionsRouter } from "./routes/sessions";
import { adminProgramsRouter } from "./routes/adminPrograms";
import { learnRouter } from "./routes/learn";
import { adminContentRouter } from "./routes/adminContent";
import { shopRouter } from "./routes/shop";
import { goalsRouter } from "./routes/goals";
import { notificationsRouter } from "./routes/notifications";
import { accountRouter } from "./routes/account";
import { progressRouter } from "./routes/progress";
import { recommendationsRouter } from "./routes/recommendations";
import { adminRouter } from "./routes/admin";
import { adminShopRouter } from "./routes/adminShop";
import { adminCareRouter } from "./routes/adminCare";
import { adminAnalyticsRouter } from "./routes/adminAnalytics";
import { aiRouter } from "./routes/ai";
import { growthRouter } from "./routes/growth";
import { gamificationRouter } from "./routes/gamification";
import { tipsRouter } from "./routes/tips";

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
app.use("/v1", homeRouter);
app.use("/v1", sessionsRouter);
app.use("/v1", adminProgramsRouter);
app.use("/v1", learnRouter);
app.use("/v1", adminContentRouter);
app.use("/v1", shopRouter);
app.use("/v1", goalsRouter);
app.use("/v1", notificationsRouter);
app.use("/v1", accountRouter);
app.use("/v1", progressRouter);
app.use("/v1", recommendationsRouter);
app.use("/v1", adminRouter);
app.use("/v1", adminShopRouter);
app.use("/v1", adminCareRouter);
app.use("/v1", adminAnalyticsRouter);
app.use("/v1", aiRouter);
app.use("/v1", growthRouter);
app.use("/v1", gamificationRouter);
app.use("/v1", tipsRouter);
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
