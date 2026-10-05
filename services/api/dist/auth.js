"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const pg_1 = require("pg");
const admin_1 = require("better-auth/plugins/admin");
const expo_1 = require("@better-auth/expo");
const env_1 = require("./env");
/**
 * Better Auth instance (Phase 2b). Email+password for all clients,
 * Expo plugin for SecureStore sessions, admin plugin for roles/RBAC.
 * App rows (plans, orders…) link by email — see POST /v1/auth/link.
 */
exports.auth = (0, better_auth_1.betterAuth)({
    secret: env_1.env.BETTER_AUTH_SECRET,
    baseURL: env_1.env.BETTER_AUTH_URL,
    trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:8081",
        "vyntherapy://",
        ...(env_1.env.NODE_ENV === "development"
            ? ["exp://", "exp://**", "exp://192.168.*.*:*/**"]
            : []),
    ],
    database: new pg_1.Pool({ connectionString: env_1.env.DATABASE_URL }),
    emailAndPassword: { enabled: true },
    plugins: [(0, expo_1.expo)(), (0, admin_1.admin)()],
});
//# sourceMappingURL=auth.js.map