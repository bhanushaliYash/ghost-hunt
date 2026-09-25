/**
 * Short pull of the Check Point threat-map feed.
 * The browser talks only to this route.
 */

import { json, rejected } from "@/lib/api";
import { checkpointAttacks } from "@/lib/sources/checkpoint";

export async function GET(request: Request) {
  const block = rejected(request);
  if (block) return block;
  try {
    const attacks = await checkpointAttacks();
    return json(request, { attacks, source: "https://threatmap.checkpoint.com/" });
  } catch {
    return json(request, { attacks: [], source: "https://threatmap.checkpoint.com/" });
  }
}
