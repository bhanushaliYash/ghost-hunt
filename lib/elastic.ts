/**
 * Local hunt lab. Indexes a lookup so it can be searched in Kibana.
 * This is not the pin store. It refuses any host that is not localhost
 * or Elastic Cloud.
 */

import { assertElasticUrl } from "./security";

function config(): { url: string; user: string; pass: string } | null {
  const url = process.env.ELASTIC_URL;
  if (!url) return null;
  assertElasticUrl(url);
  return {
    url: url.replace(/\/$/, ""),
    user: process.env.ELASTIC_USERNAME || "elastic",
    pass: process.env.ELASTIC_PASSWORD || "",
  };
}

function authHeader(user: string, pass: string): string {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

export function elasticEnabled(): boolean {
  return Boolean(process.env.ELASTIC_URL);
}

export async function indexLookup(doc: {
  indicator: string;
  indicatorType: string;
  score: number;
  confidence: number;
}): Promise<void> {
  const cfg = config();
  if (!cfg) return;
  await fetch(`${cfg.url}/ghost-hunt-lookups/_doc`, {
    method: "POST",
    headers: {
      authorization: authHeader(cfg.user, cfg.pass),
      "content-type": "application/json",
    },
    body: JSON.stringify({ ...doc, at: new Date().toISOString() }),
    signal: AbortSignal.timeout(4000),
  });
}

export async function recentLookups(): Promise<{ indicator: string; indicatorType: string; score: number; at: string }[]> {
  const cfg = config();
  if (!cfg) return [];
  const response = await fetch(`${cfg.url}/ghost-hunt-lookups/_search`, {
    method: "POST",
    headers: {
      authorization: authHeader(cfg.user, cfg.pass),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      size: 15,
      sort: [{ at: "desc" }],
      query: { match_all: {} },
    }),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) return [];
  const body = (await response.json()) as {
    hits?: { hits?: { _source?: { indicator?: string; indicatorType?: string; score?: number; at?: string } }[] };
  };
  return (body.hits?.hits ?? []).map((hit) => ({
    indicator: hit._source?.indicator ?? "",
    indicatorType: hit._source?.indicatorType ?? "",
    score: hit._source?.score ?? 0,
    at: hit._source?.at ?? "",
  }));
}
