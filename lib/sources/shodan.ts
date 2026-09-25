/**
 * Shodan host lookup. Search (internet-wide) is a separate call and
 * often needs a paid membership. A 403 is reported, not hidden.
 * https://developer.shodan.io/api
 */

import { allowFetch } from "../http";
import type { SourceHit } from "../types";
import { failed, skipped } from "./common";

export type HostBanner = {
  jarm: string[];
  certs: string[];
  headers: string;
  tags: string[];
  rawSummary: string;
};

function emptyBanner(): HostBanner {
  return { jarm: [], certs: [], headers: "", tags: [], rawSummary: "" };
}

export async function shodanHost(ip: string): Promise<{ hit: SourceHit; banner: HostBanner }> {
  const key = process.env.SHODAN_API_KEY;
  if (!key) {
    return { hit: skipped("Shodan", "Add SHODAN_API_KEY for a host lookup."), banner: emptyBanner() };
  }
  try {
    const response = await allowFetch(`https://api.shodan.io/shodan/host/${encodeURIComponent(ip)}?key=${encodeURIComponent(key)}`);
    if (response.status === 404) {
      return {
        hit: { source: "Shodan", state: "clean", malicious: false, summary: "No Shodan host record.", link: "https://www.shodan.io/" },
        banner: emptyBanner(),
      };
    }
    if (!response.ok) return { hit: failed("Shodan"), banner: emptyBanner() };
    const data = (await response.json()) as {
      tags?: string[];
      ports?: number[];
      data?: { ssl?: { jarm?: string; cert?: { subject?: Record<string, string> } }; http?: { headers?: Record<string, string> }; data?: string }[];
    };
    const banner = emptyBanner();
    banner.tags = data.tags ?? [];
    for (const service of data.data ?? []) {
      if (service.ssl?.jarm) banner.jarm.push(service.ssl.jarm);
      const subject = service.ssl?.cert?.subject;
      if (subject) banner.certs.push(Object.values(subject).join(" "));
      if (service.http?.headers) {
        banner.headers += Object.entries(service.http.headers)
          .map(([name, value]) => `${name}: ${value}`)
          .join("\n");
      }
    }
    const malwareTag = banner.tags.some((tag) => /malware|c2|botnet/i.test(tag));
    banner.rawSummary = `Ports ${(data.ports ?? []).join(", ") || "none"}. Tags ${banner.tags.join(", ") || "none"}.`;
    return {
      hit: {
        source: "Shodan",
        state: malwareTag ? "hit" : "hit",
        malicious: malwareTag ? true : null,
        summary: banner.rawSummary,
        link: `https://www.shodan.io/host/${ip}`,
      },
      banner,
    };
  } catch {
    return { hit: failed("Shodan"), banner: emptyBanner() };
  }
}

export async function shodanSearch(query: string): Promise<{ ok: boolean; message: string; matches: { ip: string; port: number }[] }> {
  const key = process.env.SHODAN_API_KEY;
  if (!key) return { ok: false, message: "Shodan search needs SHODAN_API_KEY, and many free accounts cannot search.", matches: [] };
  try {
    const response = await allowFetch(
      `https://api.shodan.io/shodan/host/search?key=${encodeURIComponent(key)}&query=${encodeURIComponent(query)}`,
    );
    if (response.status === 401 || response.status === 403) {
      return { ok: false, message: "Shodan refused search. Internet-wide search is not on this free key.", matches: [] };
    }
    if (!response.ok) return { ok: false, message: "Shodan search did not answer.", matches: [] };
    const data = (await response.json()) as { matches?: { ip_str?: string; port?: number }[] };
    const matches = (data.matches ?? []).slice(0, 8).map((row) => ({ ip: row.ip_str || "", port: row.port || 0 }));
    return { ok: true, message: `${matches.length} hosts on the first page.`, matches };
  } catch {
    return { ok: false, message: "Shodan search did not answer.", matches: [] };
  }
}
