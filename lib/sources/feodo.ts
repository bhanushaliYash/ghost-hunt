/**
 * Feodo Tracker C2 list. No key. The analyst uses it for the map,
 * the IOC feed, and an IP vote. Docs: https://feodotracker.abuse.ch/
 */

import sample from "@/data/samples/feodo.json";
import { cached } from "../cache";
import { allowFetch } from "../http";
import type { SourceHit } from "../types";

export type FeodoRow = {
  ip_address: string;
  port: number;
  status: string;
  hostname: string | null;
  as_name: string;
  country: string;
  first_seen: string;
  last_online: string;
  malware: string;
};

export async function feodoRows(): Promise<{ rows: FeodoRow[]; sample: boolean }> {
  try {
    const rows = await cached("feodo", 15 * 60_000, async () => {
      const response = await allowFetch("https://feodotracker.abuse.ch/downloads/ipblocklist.json");
      if (!response.ok) throw new Error("feodo");
      const body = (await response.json()) as FeodoRow[];
      if (!Array.isArray(body) || body.length === 0) throw new Error("feodo empty");
      return body;
    });
    return { rows, sample: false };
  } catch {
    return { rows: sample as FeodoRow[], sample: true };
  }
}

export async function feodoHit(ip: string): Promise<SourceHit> {
  const { rows, sample: isSample } = await feodoRows();
  const row = rows.find((item) => item.ip_address === ip);
  if (!row) {
    return {
      source: "Feodo Tracker",
      state: isSample ? "sample" : "clean",
      malicious: false,
      summary: "Not on the Feodo C2 list we could read.",
      link: "https://feodotracker.abuse.ch/",
    };
  }
  return {
    source: "Feodo Tracker",
    state: isSample ? "sample" : "hit",
    malicious: true,
    summary: `${row.malware} C2, ${row.status}, port ${row.port}, ${row.country}, last online ${row.last_online}.`,
    link: "https://feodotracker.abuse.ch/",
  };
}
