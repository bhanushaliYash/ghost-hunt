/**
 * ThreatFox IOC search. https://threatfox.abuse.ch/api/
 */

import { abuseHeaders, allowFetch } from "../http";
import type { SourceHit } from "../types";
import { failed, skipped } from "./common";

export async function threatfoxHit(value: string): Promise<SourceHit> {
  const headers = abuseHeaders();
  if (!headers) return skipped("ThreatFox", "Add ABUSECH_AUTH_KEY to query ThreatFox.");
  try {
    const response = await allowFetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ query: "search_ioc", search_term: value }),
    });
    if (!response.ok) return failed("ThreatFox");
    const data = (await response.json()) as { query_status?: string; data?: { malware?: string; threat_type?: string }[] };
    const rows = data.data ?? [];
    if (data.query_status === "no_result" || rows.length === 0) {
      return { source: "ThreatFox", state: "clean", malicious: false, summary: "No IOC match.", link: "https://threatfox.abuse.ch/" };
    }
    const first = rows[0];
    return {
      source: "ThreatFox",
      state: "hit",
      malicious: true,
      summary: `${rows.length} IOC hit${first?.malware ? `, ${first.malware}` : ""}${first?.threat_type ? `, ${first.threat_type}` : ""}.`,
      link: "https://threatfox.abuse.ch/",
    };
  } catch {
    return failed("ThreatFox");
  }
}
