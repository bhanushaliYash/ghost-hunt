/**
 * AlienVault OTX general pulse count.
 * https://otx.alienvault.com/api
 */

import { allowFetch } from "../http";
import type { IndicatorType, SourceHit } from "../types";
import { failed, skipped } from "./common";

function section(type: IndicatorType): string | null {
  if (type === "ip") return "IPv4";
  if (type === "domain") return "domain";
  if (type === "url") return "url";
  if (type === "hash") return "file";
  return null;
}

export async function otxHit(type: IndicatorType, value: string): Promise<SourceHit> {
  const key = process.env.OTX_API_KEY;
  const path = section(type);
  if (!key || !path) return skipped("AlienVault OTX", "Add OTX_API_KEY to query OTX.");
  try {
    const response = await allowFetch(`https://otx.alienvault.com/api/v1/indicators/${path}/${encodeURIComponent(value)}/general`, {
      headers: { "X-OTX-API-KEY": key },
    });
    if (!response.ok) return failed("AlienVault OTX");
    const data = (await response.json()) as { pulse_info?: { count?: number } };
    const count = data.pulse_info?.count ?? 0;
    return {
      source: "AlienVault OTX",
      state: count > 0 ? "hit" : "clean",
      malicious: count > 0,
      summary: count > 0 ? `${count} related pulses.` : "No pulses.",
      link: "https://otx.alienvault.com/",
    };
  } catch {
    return failed("AlienVault OTX");
  }
}
