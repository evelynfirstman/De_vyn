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
  FLUTTERWAVE_PUBLIC_KEY: z.string().default(""),
  FLUTTERWAVE_SECRET_KEY: z.string().default(""),
  FLUTTERWAVE_LIVE: z.string().default("false"),
  FLUTTERWAVE_REDIRECT_URL: z.string().default(""),
  QR_SECRET: z.string().default("dev-qr-secret"),
  WOO_URL: z.string().default(""),
  WOO_CK: z.string().default(""),
  WOO_CS: z.string().default(""),
});

export type Env = z.infer<typeof schema>;
export const env: Env = schema.parse(process.env);
