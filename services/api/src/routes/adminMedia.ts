import { Router } from "express";
import { z } from "zod";
import {
  bucketName,
  buildObjectKey,
  deleteObject,
  presignPut,
  publicUrlFor,
  type BucketKind,
} from "../storage";

/**
 * Admin media uploads to R2/S3 (Phase 9). Mounted at /v1/admin/*, so the
 * global requireAdmin gate in index.ts protects every route here.
 */
export const adminMediaRouter = Router();

const PRESIGN_TTL_SECONDS = 600;

const presignSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[\w.+-]+\/[\w.+-]+$/, "Expected a MIME type like image/png"),
  kind: z.enum(["media", "products"]).default("media"),
  prefix: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9/_-]+$/)
    .default("uploads"),
});

adminMediaRouter.post("/admin/media/presign", async (req, res, next) => {
  try {
    const body = presignSchema.parse(req.body);
    const kind = body.kind as BucketKind;
    const key = buildObjectKey(body.filename, body.prefix);
    const uploadUrl = await presignPut(
      kind,
      key,
      body.contentType,
      PRESIGN_TTL_SECONDS,
    );
    res.status(201).json({
      data: {
        bucket: bucketName(kind),
        key,
        uploadUrl,
        publicUrl: publicUrlFor(kind, key),
        expiresIn: PRESIGN_TTL_SECONDS,
        method: "PUT",
        headers: { "Content-Type": body.contentType },
      },
    });
  } catch (err) {
    next(err);
  }
});

const deleteSchema = z.object({
  key: z.string().min(1).max(512),
  kind: z.enum(["media", "products"]).default("media"),
});

adminMediaRouter.delete("/admin/media", async (req, res, next) => {
  try {
    const body = deleteSchema.parse(req.body);
    await deleteObject(body.kind as BucketKind, body.key);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
