"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authHandler = void 0;
exports.requireUser = requireUser;
exports.requireAdmin = requireAdmin;
const node_1 = require("better-auth/node");
const auth_1 = require("./auth");
exports.authHandler = (0, node_1.toNodeHandler)(auth_1.auth);
/** Require any signed-in user (401 otherwise). */
async function requireUser(req, res, next) {
    try {
        const session = await auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            res.status(401).json({
                error: { code: "UNAUTHENTICATED", message: "Sign in required" },
            });
            return;
        }
        req.authUser = {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role ?? null,
        };
        next();
    }
    catch (err) {
        next(err);
    }
}
/** Require an admin-role user (401 unauthenticated, 403 forbidden). */
async function requireAdmin(req, res, next) {
    try {
        const session = await auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            res.status(401).json({
                error: { code: "UNAUTHENTICATED", message: "Sign in required" },
            });
            return;
        }
        const role = session.user.role ?? null;
        if (role !== "admin") {
            res.status(403).json({
                error: { code: "FORBIDDEN", message: "Admin role required" },
            });
            return;
        }
        req.authUser = {
            id: session.user.id,
            email: session.user.email,
            role,
        };
        next();
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=auth-guard.js.map