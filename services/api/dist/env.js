"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const schema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(["development", "test", "production"])
        .default("development"),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().default("postgres://vyn:vyn@localhost:5432/vyn"),
    REDIS_URL: zod_1.z.string().default("redis://localhost:6379"),
    S3_ENDPOINT: zod_1.z.string().default("http://localhost:9090"),
    S3_ACCESS_KEY: zod_1.z.string().default("test"),
    S3_SECRET_KEY: zod_1.z.string().default("test"),
    S3_MEDIA_BUCKET: zod_1.z.string().default("vyn-media"),
    S3_PRODUCTS_BUCKET: zod_1.z.string().default("vyn-products"),
    FLUTTERWAVE_PUBLIC_KEY: zod_1.z.string().default(""),
    FLUTTERWAVE_SECRET_KEY: zod_1.z.string().default(""),
    FLUTTERWAVE_LIVE: zod_1.z.string().default("false"),
    FLUTTERWAVE_REDIRECT_URL: zod_1.z.string().default(""),
    GROQ_API_KEY: zod_1.z.string().default(""),
    GROQ_MODEL: zod_1.z.string().default("openai/gpt-oss-20b"),
    BETTER_AUTH_SECRET: zod_1.z.string().default("dev-secret-change-me"),
    BETTER_AUTH_URL: zod_1.z.string().default("http://localhost:4000"),
    QR_SECRET: zod_1.z.string().default("dev-qr-secret"),
    WOO_URL: zod_1.z.string().default(""),
    WOO_CK: zod_1.z.string().default(""),
    WOO_CS: zod_1.z.string().default(""),
});
exports.env = schema.parse(process.env);
//# sourceMappingURL=env.js.map