/**
 * AbuseIPDB confidence check for one IP.
 * https://docs.abuseipdb.com/
 */

import { allowFetch } from "../http";
import type { SourceHit } from "../types";
import { failed, skipped } from "./common";

export async function abuseipdbHit(ip: string): Promise<SourceHit> {
  const key = process.env.ABUSEIPDB_API_KEY;
  if (!key) return skipped("AbuseIPDB", "Add ABUSEIPDB_API_KEY to query AbuseIPDB.");
  try {
    const response = await allowFetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`, {
      headers: { key, accept: "application/json" },
    });
    if (!response.ok) return failed("AbuseIPDB");
    const data = (await response.json()) as { data?: { abuseConfidenceScore?: number; totalReports?: number } };
    const score = data.data?.abuseConfidenceScore ?? 0;
    const reports = data.data?.totalReports ?? 0;
    const malicious = score >= 25;
    return {
      source: "AbuseIPDB",
      state: malicious ? "hit" : "clean",
      malicious,
      summary: `Confidence ${score} from ${reports} reports in 90 days.`,
      link: "https://www.abuseipdb.com/",
    };
  } catch {
    return failed("AbuseIPDB");
  }
}
