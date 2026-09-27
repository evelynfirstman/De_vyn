import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "./logger";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFound(_req: Request, res: Response): void {
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Route not found" } });
}

function isPgForeignKeyViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "23503"
  );
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid request",
        details: err.flatten(),
      },
    });
    return;
  }
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null,
      },
    });
    return;
  }
  if (isPgForeignKeyViolation(err)) {
    res.status(404).json({
      error: { code: "USER_NOT_FOUND", message: "User does not exist" },
    });
    return;
  }
  logger.error({ err }, "unhandled error");
  res
    .status(500)
    .json({ error: { code: "INTERNAL", message: "Unexpected error" } });
}
