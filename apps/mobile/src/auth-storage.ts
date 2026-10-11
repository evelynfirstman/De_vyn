import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Storage for the Better Auth Expo client. `expo-secure-store` is native-only,
 * so the web (PWA) build falls back to `localStorage` to persist the session
 * cookie and cached session data in the browser.
 *
 * Shape mirrors ExpoClientStorage: synchronous + async get/set.
 */
type AuthStorage = Pick<
  typeof SecureStore,
  "setItem" | "setItemAsync" | "getItem" | "getItemAsync"
>;

type WebStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function webStore(): WebStore | undefined {
  return (globalThis as { localStorage?: WebStore }).localStorage;
}

const webStorage: AuthStorage = {
  getItem: (key) => webStore()?.getItem(key) ?? null,
  getItemAsync: async (key) => webStore()?.getItem(key) ?? null,
  setItem: (key, value) => {
    webStore()?.setItem(key, value);
  },
  setItemAsync: async (key, value) => {
    webStore()?.setItem(key, value);
  },
};

export const authStorage: AuthStorage =
  Platform.OS === "web" ? webStorage : SecureStore;
