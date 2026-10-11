import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

/**
 * S3-compatible object storage. Points at S3Mock locally and Cloudflare R2
 * in staging/prod (R2 uses region "auto"). Same code path for both.
 */
export type BucketKind = "media" | "products";

export function bucketName(kind: BucketKind): string {
  return kind === "media" ? env.S3_MEDIA_BUCKET : env.S3_PRODUCTS_BUCKET;
}

export const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
});

/** Strip directories/unsafe chars; keep a short, readable suffix. */
export function safeFilename(filename: string): string {
  const base = path.basename(filename).toLowerCase();
  const cleaned = base
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-80);
  return cleaned || "file";
}

/** Deterministic-ish, collision-free key: <prefix>/<YYYY-MM-DD>/<uuid>-<name>. */
export function buildObjectKey(filename: string, prefix = "uploads"): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${prefix}/${day}/${randomUUID()}-${safeFilename(filename)}`;
}

/**
 * Public read URL for an object. Uses S3_PUBLIC_BASE_URL (R2 public bucket or
 * CDN) when configured, otherwise falls back to the raw endpoint/bucket.
 */
export function publicUrlFor(kind: BucketKind, key: string): string {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const base = env.S3_PUBLIC_BASE_URL.replace(/\/+$/, "");
  if (base) return `${base}/${encodedKey}`;
  const endpoint = env.S3_ENDPOINT.replace(/\/+$/, "");
  return `${endpoint}/${bucketName(kind)}/${encodedKey}`;
}

/** Presigned PUT for direct-from-browser upload to R2. */
export async function presignPut(
  kind: BucketKind,
  key: string,
  contentType: string,
  expiresIn = 600,
): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucketName(kind),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  );
}

/** Delete an object (admin cleanup). No-op errors bubble to the caller. */
export async function deleteObject(
  kind: BucketKind,
  key: string,
): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({ Bucket: bucketName(kind), Key: key }),
  );
}
