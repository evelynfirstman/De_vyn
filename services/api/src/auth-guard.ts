import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./auth";

export const authHandler = toNodeHandler(auth);

export type AuthedRequest = Request & {
  authUser?: { id: string; email: string; role?: string | null };
};

/** Require any signed-in user (401 otherwise). */
export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      res.status(401).json({
        error: { code: "UNAUTHENTICATED", message: "Sign in required" },
      });
      return;
    }
    (req as AuthedRequest).authUser = {
      id: session.user.id,
      email: session.user.email,
      role: (session.user as { role?: string | null }).role ?? null,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Require an admin-role user (401 unauthenticated, 403 forbidden). */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      res.status(401).json({
        error: { code: "UNAUTHENTICATED", message: "Sign in required" },
      });
      return;
    }
    const role = (session.user as { role?: string | null }).role ?? null;
    if (role !== "admin") {
      res.status(403).json({
        error: { code: "FORBIDDEN", message: "Admin role required" },
      });
      return;
    }
    (req as AuthedRequest).authUser = {
      id: session.user.id,
      email: session.user.email,
      role,
    };
    next();
  } catch (err) {
    next(err);
  }
}
