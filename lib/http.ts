/**
 * Outbound HTTP. Every URL is checked against the allowlist first.
 * Redirects are followed once, and only if the next host is also allowlisted,
 * so an intel API cannot bounce the server at an internal address.
 */

import { assertAllowed } from "./security";

export async function allowFetch(url: string, init: RequestInit = {}, hops = 0): Promise<Response> {
  assertAllowed(url);
  const headers = new Headers(init.headers);
  if (!headers.has("user-agent")) headers.set("user-agent", "ghost-hunt/0.1");
  const response = await fetch(url, {
    ...init,
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(8000),
  });
  if (hops < 1 && [301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get("location");
    if (!location) return response;
    const next = new URL(location, url).toString();
    const method = response.status === 303 ? "GET" : init.method;
    return allowFetch(next, { ...init, method, body: method === "GET" ? undefined : init.body }, hops + 1);
  }
  return response;
}

export function abuseHeaders(): HeadersInit | null {
  const key = process.env.ABUSECH_AUTH_KEY;
  if (!key) return null;
  return { "Auth-Key": key };
}
