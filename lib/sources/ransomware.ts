/**
 * Named ransomware victims for the map and the attack list.
 * Public API, no key. https://www.ransomware.live/
 */

import { cached } from "../cache";
import { allowFetch } from "../http";
import type { AttackItem, MapPoint } from "../types";
import { centroid, countryCode, jitter } from "../geo";

type Victim = {
  victim?: string;
  group?: string;
  country?: string;
  discovered?: string;
  url?: string;
  post_url?: string;
  website?: string;
};

function listFrom(body: unknown): Victim[] {
  if (Array.isArray(body)) return body as Victim[];
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    for (const key of ["victims", "results", "data"]) {
      if (Array.isArray(record[key])) return record[key] as Victim[];
    }
  }
  return [];
}

export async function recentVictims(): Promise<{ attacks: AttackItem[]; points: MapPoint[]; sample: boolean }> {
  try {
    const victims = await cached("victims", 15 * 60_000, async () => {
      const response = await allowFetch("https://api.ransomware.live/v2/recentvictims");
      if (!response.ok) throw new Error("victims");
      const rows = listFrom(await response.json()).slice(0, 20);
      if (!rows.length) throw new Error("victims empty");
      return rows;
    });
    return { ...toView(victims), sample: false };
  } catch {
    return { attacks: [], points: [], sample: true };
  }
}

function toView(victims: Victim[]): { attacks: AttackItem[]; points: MapPoint[] } {
  const attacks: AttackItem[] = [];
  const points: MapPoint[] = [];
  victims.forEach((row, index) => {
    const name = row.victim || row.group || "Unnamed victim";
    const href = row.post_url || row.url || row.website || "https://www.ransomware.live/";
    attacks.push({
      name,
      href,
      detail: [row.group, row.country, row.discovered].filter(Boolean).join(" · "),
    });
    const code = countryCode(row.country);
    const center = centroid(code);
    if (!center) return;
    const [lat, lng] = jitter(`${name}-${index}`, center[0], center[1]);
    points.push({ id: `victim-${index}`, lat, lng, label: `${name} (${row.group || code})`, kind: "victim", href });
  });
  return { attacks, points };
}
