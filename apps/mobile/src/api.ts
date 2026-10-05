import AsyncStorage from "@react-native-async-storage/async-storage";
import { authClient } from "./auth-client";
import type { QueuedCompletion } from "./types";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export const CART_KEY = "vyn:cart";
export const QUEUE_KEY = "vyn:pending-completions";

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function authHeaders(): Promise<Record<string, string>> {
  try {
    const cookies = await authClient.getCookie();
    return cookies ? { Cookie: cookies } : {};
  } catch {
    return {};
  }
}

type Envelope = {
  data?: unknown;
  error?: { message: string };
};

async function parseEnvelope(res: Response): Promise<unknown> {
  const json = (await res.json()) as Envelope;
  if (!res.ok)
    throw new Error(json.error?.message ?? `Request failed (${res.status})`);
  return json.data;
}

export async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { ...(await authHeaders()) },
    credentials: "omit",
  });
  return (await parseEnvelope(res)) as T;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    credentials: "omit",
    body: JSON.stringify(body),
  });
  return (await parseEnvelope(res)) as T;
}

export async function putJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    credentials: "omit",
    body: JSON.stringify(body),
  });
  return (await parseEnvelope(res)) as T;
}

export async function delJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    credentials: "omit",
    body: JSON.stringify(body),
  });
  if (res.status === 204) return null as T;
  return (await parseEnvelope(res)) as T;
}

/**
 * Backend returns `{ data: T }` and helpers above already unwrap to `T`.
 * Older call sites still do `x.data` — these helpers tolerate both shapes
 * so a mismatch can never set state to `undefined` again.
 */
export function unwrap<T>(
  value: T | { data?: T } | null | undefined,
  fallback: T,
): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object" && value !== null && "data" in value) {
    const inner = (value as { data?: T }).data;
    return (inner ?? fallback) as T;
  }
  return value as T;
}

export function unwrapArray<T>(
  value: T[] | { data?: T[] } | null | undefined,
): T[] {
  return unwrap<T[]>(value as T[] | { data?: T[] }, [] as unknown as T[]) ?? [];
}

export async function readQueue(): Promise<QueuedCompletion[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedCompletion[]) : [];
  } catch {
    return [];
  }
}

/** Push queued completions to the API; stops at first failure (offline). */
export async function flushQueue(): Promise<number> {
  const queue = await readQueue();
  let sent = 0;
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      await postJson("/v1/sessions/complete", {
        userId: item.userId,
        programId: item.programId,
        durationSec: item.durationSec,
      });
      sent += 1;
    } catch {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(i)));
      return sent;
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
  return sent;
}
