/**
 * GreyNoise community classification for one IP.
 * https://docs.greynoise.io/
 */

import { allowFetch } from "../http";
import type { SourceHit } from "../types";
import { failed, skipped } from "./common";

export async function greynoiseHit(ip: string): Promise<SourceHit> {
  const key = process.env.GREYNOISE_API_KEY;
  if (!key) return skipped("GreyNoise", "Add GREYNOISE_API_KEY to query GreyNoise.");
  try {
    const response = await allowFetch(`https://api.greynoise.io/v3/community/${encodeURIComponent(ip)}`, {
      headers: { key },
    });
    if (!response.ok) return failed("GreyNoise");
    const data = (await response.json()) as { classification?: string; name?: string };
    const classification = (data.classification || "unknown").toLowerCase();
    if (classification === "malicious") {
      return { source: "GreyNoise", state: "hit", malicious: true, summary: `Classified malicious${data.name ? ` (${data.name})` : ""}.`, link: "https://viz.greynoise.io/" };
    }
    if (classification === "benign") {
      return { source: "GreyNoise", state: "clean", malicious: false, summary: "Classified benign.", link: "https://viz.greynoise.io/" };
    }
    return { source: "GreyNoise", state: "hit", malicious: null, summary: `Classification ${classification}. No vote.`, link: "https://viz.greynoise.io/" };
  } catch {
    return failed("GreyNoise");
  }
}
