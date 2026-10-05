"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.checkRedis = checkRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = require("./logger");
exports.redis = new ioredis_1.default(env_1.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
});
exports.redis.on("error", (err) => {
    logger_1.logger.warn({ err }, "redis error");
});
async function checkRedis() {
    try {
        await exports.redis.ping();
        return true;
    }
    catch (err) {
        logger_1.logger.warn({ err }, "redis check failed");
        return false;
    }
}
//# sourceMappingURL=redis.js.map