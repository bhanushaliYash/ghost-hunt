/**
 * Older path. Same Check Point feed as /api/threatmap.
 */

import { json, rejected } from "@/lib/api";
import { checkpointAttacks as liveAttacks } from "@/lib/sources/checkpoint";

export async function GET(request: Request) {
  const block = rejected(request);
  if (block) return block;
  try {
    const attacks = await liveAttacks();
    return json(request, { attacks, source: "https://threatmap.checkpoint.com/" });
  } catch {
    return json(request, { attacks: [], source: "https://threatmap.checkpoint.com/" });
  }
}
