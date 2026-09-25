/**
 * URLhaus malware URL and host lookup.
 * https://urlhaus.abuse.ch/api/
 * The URL is sent as a form field. This server does not request it.
 */

import { abuseHeaders, allowFetch } from "../http";
import type { SourceHit } from "../types";
import { failed, skipped } from "./common";

export async function urlhausHit(kind: "url" | "host", value: string): Promise<SourceHit> {
  const headers = abuseHeaders();
  if (!headers) return skipped("URLhaus", "Add ABUSECH_AUTH_KEY to query URLhaus.");
  try {
    const body = new URLSearchParams(kind === "url" ? { url: value } : { host: value });
    const response = await allowFetch(`https://urlhaus-api.abuse.ch/v1/${kind}/`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!response.ok) return failed("URLhaus");
    const data = (await response.json()) as { query_status?: string; threat?: string; urlhaus_reference?: string };
    const listed = data.query_status === "is_malware" || data.query_status === "listed";
    const clean = data.query_status === "no_results" || data.query_status === "ok";
    if (!listed && !clean) return failed("URLhaus");
    return {
      source: "URLhaus",
      state: listed ? "hit" : "clean",
      malicious: listed,
      summary: listed ? `Listed${data.threat ? ` as ${data.threat}` : ""}.` : "No malware URL on record.",
      link: data.urlhaus_reference || "https://urlhaus.abuse.ch/",
    };
  } catch {
    return failed("URLhaus");
  }
}
