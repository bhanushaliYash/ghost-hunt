/**
 * Hunt lab. Reads Elasticsearch only. Pins stay in Neon and are not listed here.
 */

import { json, rejected } from "@/lib/api";
import { elasticEnabled, recentLookups } from "@/lib/elastic";

export async function GET(request: Request) {
  const block = rejected(request);
  if (block) return block;
  if (!elasticEnabled()) {
    return json(request, { enabled: false, rows: [], message: "Lab offline. Set ELASTIC_URL and start docker compose." });
  }
  try {
    const rows = await recentLookups();
    return json(request, { enabled: true, rows, message: rows.length ? "" : "Index is empty. Run a lookup first." });
  } catch {
    return json(request, { enabled: true, rows: [], message: "Elasticsearch did not answer on the configured URL." });
  }
}
