export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (res.status === 204) return null as T;
  const json = (await res.json()) as
    { data: T } | { error: { code: string; message: string } };
  if (!res.ok || !("data" in json)) {
    throw new Error(
      "error" in json ? json.error.message : `Request failed (${res.status})`,
    );
  }
  return json.data;
}

export function naira(minor: number, currency: string): string {
  const major = (minor / 100).toLocaleString();
  return currency === "NGN" ? `₦${major}` : `${currency} ${major}`;
}
