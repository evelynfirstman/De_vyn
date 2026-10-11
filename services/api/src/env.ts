import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default("postgres://vyn:vyn@localhost:5432/vyn"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  S3_ENDPOINT: z.string().default("http://localhost:9090"),
  S3_ACCESS_KEY: z.string().default("test"),
  S3_SECRET_KEY: z.string().default("test"),
  S3_MEDIA_BUCKET: z.string().default("vyn-media"),
  S3_PRODUCTS_BUCKET: z.string().default("vyn-products"),
  // Cloudflare R2 uses region "auto". S3Mock ignores it.
  S3_REGION: z.string().default("auto"),
  // Public base for reads (R2 public bucket URL or CDN). Falls back to the
  // endpoint + bucket when unset (fine for S3Mock/local).
  S3_PUBLIC_BASE_URL: z.string().default(""),
  S3_FORCE_PATH_STYLE: z.string().default("false"),
  FLUTTERWAVE_PUBLIC_KEY: z.string().default(""),
  FLUTTERWAVE_SECRET_KEY: z.string().default(""),
  FLUTTERWAVE_LIVE: z.string().default("false"),
  FLUTTERWAVE_REDIRECT_URL: z.string().default(""),
  GROQ_API_KEY: z.string().default(""),
  GROQ_MODEL: z.string().default("openai/gpt-oss-20b"),
  BETTER_AUTH_SECRET: z.string().default("dev-secret-change-me"),
  BETTER_AUTH_URL: z.string().default("http://localhost:4000"),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:8081"),
  QR_SECRET: z.string().default("dev-qr-secret"),
  WOO_URL: z.string().default(""),
  WOO_CK: z.string().default(""),
  WOO_CS: z.string().default(""),
  // "expand" ships bundle members (no kit product needed in TeemDrop);
  // "as-is" mirrors the catalog SKUs 1:1.
  WOO_BUNDLE_MODE: z.enum(["expand", "as-is"]).default("expand"),
  WOO_TIMEOUT_MS: z.coerce.number().default(10000),
  FULFILLMENT_PROVIDER: z.string().default("woo-bridge"),
  // Background worker: retry failed pushes + pull tracking back from Woo.
  FULFILLMENT_WORKER: z.string().default("true"),
  FULFILLMENT_POLL_MS: z.coerce.number().default(60000),
});

export type Env = z.infer<typeof schema>;
export const env: Env = schema.parse(process.env);
