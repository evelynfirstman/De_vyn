import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Better Auth client (Phase 2b). Sessions + cookies persist in
 * SecureStore; API calls attach them via authHeaders() in App.tsx.
 */
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "vyntherapy",
      storagePrefix: "vyn",
      storage: SecureStore,
    }),
  ],
});
