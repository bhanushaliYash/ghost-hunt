/**
 * VirusTotal v3 lookup. The indicator is a path segment, not a URL we open.
 * https://docs.virustotal.com/reference/overview
 */

import { allowFetch } from "../http";
import type { IndicatorType, SourceHit } from "../types";
import { failed, skipped } from "./common";

function pathFor(type: IndicatorType, value: string): string | null {
  if (type === "ip") return `ip_addresses/${encodeURIComponent(value)}`;
  if (type === "domain") return `domains/${encodeURIComponent(value)}`;
  if (type === "hash") return `files/${encodeURIComponent(value)}`;
  if (type === "url") return `urls/${Buffer.from(value).toString("base64url")}`;
  return null;
}

export async function virusTotalHit(type: IndicatorType, value: string): Promise<SourceHit> {
  const key = process.env.VIRUSTOTAL_API_KEY;
  const path = pathFor(type, value);
  if (!key || !path) return skipped("VirusTotal", "Add VIRUSTOTAL_API_KEY to query VirusTotal.");
  try {
    const response = await allowFetch(`https://www.virustotal.com/api/v3/${path}`, {
      headers: { "x-apikey": key },
    });
    if (response.status === 404) {
      return { source: "VirusTotal", state: "clean", malicious: false, summary: "Not in VirusTotal.", link: "https://www.virustotal.com/" };
    }
    if (!response.ok) return failed("VirusTotal");
    const data = (await response.json()) as {
      data?: { attributes?: { last_analysis_stats?: { malicious?: number; suspicious?: number } } };
    };
    const stats = data.data?.attributes?.last_analysis_stats;
    const maliciousCount = (stats?.malicious ?? 0) + (stats?.suspicious ?? 0);
    return {
      source: "VirusTotal",
      state: maliciousCount > 0 ? "hit" : "clean",
      malicious: maliciousCount > 0,
      summary: maliciousCount > 0 ? `${maliciousCount} engines marked it malicious or suspicious.` : "No malicious engine votes.",
      link: "https://www.virustotal.com/",
    };
  } catch {
    return failed("VirusTotal");
  }
}
