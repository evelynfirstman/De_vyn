import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Better Auth client against the API (Phase 2b). Cookies carry the session. */
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [adminClient()],
});

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
};
