/**
 * Home is the shift board: where things are, what just showed up,
 * and which CVEs to patch before the rest of the queue.
 */

import { rankCve, recentCves } from "./cve";
import { centroid, jitter } from "./geo";
import { feodoRows } from "./sources/feodo";
import { recentVictims } from "./sources/ransomware";
import type { AttackItem, CveRow, FeedItem, MapPoint } from "./types";

export async function homeBoard(): Promise<{
  points: MapPoint[];
  feed: FeedItem[];
  attacks: AttackItem[];
  cves: CveRow[];
  sample: string[];
}> {
  const [feodo, victims, cves] = await Promise.all([feodoRows(), recentVictims(), recentCves()]);
  const sample: string[] = [];
  if (feodo.sample) sample.push("C2 map");
  if (victims.sample) sample.push("Victim map");
  if (cves.sample) sample.push("CVE strip");

  const points: MapPoint[] = [];
  const feed: FeedItem[] = [];
  for (const row of feodo.rows.slice(0, 40)) {
    const center = centroid(row.country);
    if (center) {
      const [lat, lng] = jitter(row.ip_address, center[0], center[1]);
      points.push({
        id: row.ip_address,
        lat,
        lng,
        label: `${row.ip_address} ${row.malware} ${row.status}`,
        kind: "c2",
        href: `/lookup?q=${encodeURIComponent(row.ip_address)}`,
      });
    }
    feed.push({
      indicator: row.ip_address,
      type: "ip",
      source: "Feodo Tracker",
      detail: `${row.malware} · ${row.status} · ${row.country}`,
      href: `/lookup?q=${encodeURIComponent(row.ip_address)}`,
    });
  }
  points.push(...victims.points);

  return {
    points,
    feed: feed.slice(0, 12),
    attacks: victims.attacks.slice(0, 8),
    cves: cves.rows.sort((a, b) => rankCve(b) - rankCve(a)).slice(0, 8),
    sample,
  };
}
