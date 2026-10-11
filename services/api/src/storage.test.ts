import { describe, expect, it } from "vitest";
import {
  bucketName,
  buildObjectKey,
  presignPut,
  publicUrlFor,
  safeFilename,
} from "./storage";

describe("R2/S3 storage helpers (Phase 9)", () => {
  it("resolves bucket names from kind", () => {
    expect(bucketName("media")).toBe("vyn-media");
    expect(bucketName("products")).toBe("vyn-products");
  });

  it("strips directories and unsafe characters from filenames", () => {
    expect(safeFilename("../../etc/My Photo (1).PNG")).toBe("my-photo-1-.png");
    expect(safeFilename("")).toBe("file");
  });

  it("builds a date-partitioned, prefixed key", () => {
    const key = buildObjectKey("Hero Image.webp", "hero");
    expect(key).toMatch(
      /^hero\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}-hero-image\.webp$/,
    );
  });

  it("falls back to endpoint + bucket when no public base is set", () => {
    const url = publicUrlFor("media", "uploads/a b.png");
    expect(url).toBe("http://localhost:9090/vyn-media/uploads/a%20b.png");
  });

  it("signs an upload URL offline (no network) containing the key", async () => {
    const key = "uploads/2026-10-10/abc-logo.webp";
    const url = await presignPut("products", key, "image/webp", 600);
    expect(url).toContain("vyn-products");
    expect(url).toContain("abc-logo.webp");
    expect(url).toContain("X-Amz-Signature");
  });
});
