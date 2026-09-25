/**
 * Live attack feed from Radware's public threat map.
 * https://livethreatmap.radware.com/api/map/attacks
 * We plot their records. We do not scrape or rehost their map application.
 */

import { cached } from "../cache";
import { centroid, countryCode } from "../geo";
import { allowFetch } from "../http";

export type LiveAttack = {
  id: string;
  from: [number, number];
  to: [number, number];
  source: string;
  destination: string;
  type: string;
  weight: string;
};

type Raw = {
  sourceCountry?: string;
  destinationCountry?: string;
  type?: string;
  weight?: string;
  attackTime?: string;
};

function flatten(body: unknown): Raw[] {
  if (!Array.isArray(body)) return [];
  const rows: Raw[] = [];
  for (const item of body) {
    if (Array.isArray(item)) rows.push(...(item as Raw[]));
    else if (item && typeof item === "object") rows.push(item as Raw);
  }
  return rows;
}

export async function liveAttacks(): Promise<LiveAttack[]> {
  return cached("radware-attacks", 60_000, async () => {
    const response = await allowFetch("https://livethreatmap.radware.com/api/map/attacks?limit=40");
    if (!response.ok) return [];
    const rows = flatten(await response.json());
    const attacks: LiveAttack[] = [];
    rows.forEach((row, index) => {
      const source = countryCode(row.sourceCountry);
      const destination = countryCode(row.destinationCountry);
      const from = centroid(source);
      const to = centroid(destination);
      if (!from || !to || source === destination) return;
      attacks.push({
        id: `${source}-${destination}-${row.attackTime ?? index}-${index}`,
        from,
        to,
        source,
        destination,
        type: row.type || "attack",
        weight: row.weight || "Light",
      });
    });
    return attacks.slice(0, 40);
  });
}
