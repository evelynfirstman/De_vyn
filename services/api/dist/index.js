"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const env_1 = require("./env");
const logger_1 = require("./logger");
const migrate_1 = require("./migrate");
const errors_1 = require("./errors");
const health_1 = require("./routes/health");
const catalog_1 = require("./routes/catalog");
const journey_1 = require("./routes/journey");
const home_1 = require("./routes/home");
const sessions_1 = require("./routes/sessions");
const adminPrograms_1 = require("./routes/adminPrograms");
const learn_1 = require("./routes/learn");
const adminContent_1 = require("./routes/adminContent");
const shop_1 = require("./routes/shop");
const goals_1 = require("./routes/goals");
const notifications_1 = require("./routes/notifications");
const account_1 = require("./routes/account");
const progress_1 = require("./routes/progress");
const recommendations_1 = require("./routes/recommendations");
const admin_1 = require("./routes/admin");
const adminShop_1 = require("./routes/adminShop");
const adminCare_1 = require("./routes/adminCare");
const adminAnalytics_1 = require("./routes/adminAnalytics");
const ai_1 = require("./routes/ai");
const growth_1 = require("./routes/growth");
const gamification_1 = require("./routes/gamification");
const tips_1 = require("./routes/tips");
const coach_1 = require("./routes/coach");
const authLink_1 = require("./routes/authLink");
const auth_guard_1 = require("./auth-guard");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000", "http://localhost:8081"],
    credentials: true,
}));
// Better Auth owns its routes (and body parsing) — mount before express.json().
app.all("/api/auth/*", auth_guard_1.authHandler);
app.use(express_1.default.json());
app.use((req, _res, next) => {
    logger_1.logger.info({ method: req.method, url: req.url }, "request");
    next();
});
app.use("/health", health_1.healthRouter);
// Admin RBAC gate: every /v1/admin/* route requires the admin role,
// regardless of which router serves it.
app.use("/v1/admin", auth_guard_1.requireAdmin);
app.use("/v1", catalog_1.catalogRouter);
app.use("/v1", journey_1.journeyRouter);
app.use("/v1", home_1.homeRouter);
app.use("/v1", sessions_1.sessionsRouter);
app.use("/v1", adminPrograms_1.adminProgramsRouter);
app.use("/v1", learn_1.learnRouter);
app.use("/v1", adminContent_1.adminContentRouter);
app.use("/v1", shop_1.shopRouter);
app.use("/v1", goals_1.goalsRouter);
app.use("/v1", notifications_1.notificationsRouter);
app.use("/v1", account_1.accountRouter);
app.use("/v1", progress_1.progressRouter);
app.use("/v1", recommendations_1.recommendationsRouter);
app.use("/v1", admin_1.adminRouter);
app.use("/v1", adminShop_1.adminShopRouter);
app.use("/v1", adminCare_1.adminCareRouter);
app.use("/v1", adminAnalytics_1.adminAnalyticsRouter);
app.use("/v1", ai_1.aiRouter);
app.use("/v1", growth_1.growthRouter);
app.use("/v1", gamification_1.gamificationRouter);
app.use("/v1", tips_1.tipsRouter);
app.use("/v1", coach_1.coachRouter);
app.use("/v1", authLink_1.authLinkRouter);
app.use(errors_1.notFound);
app.use(errors_1.errorHandler);
async function main() {
    await (0, migrate_1.migrate)();
    const server = app.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`api listening on :${env_1.env.PORT}`);
    });
    function shutdown(signal) {
        logger_1.logger.info(`${signal} received, closing`);
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(1), 10000).unref();
    }
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}
main().catch((err) => {
    logger_1.logger.error({ err }, "api startup failed");
    process.exit(1);
});
//# sourceMappingURL=index.js.map