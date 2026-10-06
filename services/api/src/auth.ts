import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { admin } from "better-auth/plugins/admin";
import { expo } from "@better-auth/expo";
import { env } from "./env";

/**
 * Better Auth instance (Phase 2b). Email+password for all clients,
 * Expo plugin for SecureStore sessions, admin plugin for roles/RBAC.
 * App rows (plans, orders…) link by email — see POST /v1/auth/link.
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [
    ...env.CORS_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    "vyntherapy://",
    ...(env.NODE_ENV === "development"
      ? ["exp://", "exp://**", "exp://192.168.*.*:*/**"]
      : []),
  ],
  database: new Pool({ connectionString: env.DATABASE_URL }),
  emailAndPassword: { enabled: true },
  plugins: [expo(), admin()],
});
