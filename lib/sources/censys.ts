/**
 * Censys Platform host lookup. Free accounts can look up one host.
 * Search spends monthly credits and is not required for the page to work.
 * https://docs.censys.com/reference/get-started
 */

import { allowFetch } from "../http";
import type { SourceHit } from "../types";
import type { HostBanner } from "./shodan";
import { failed, skipped } from "./common";

export async function censysHost(ip: string): Promise<{ hit: SourceHit; banner: HostBanner }> {
  const token = process.env.CENSYS_API_TOKEN;
  const empty: HostBanner = { jarm: [], certs: [], headers: "", tags: [], rawSummary: "" };
  if (!token) return { hit: skipped("Censys", "Add CENSYS_API_TOKEN for a host lookup."), banner: empty };
  try {
    const response = await allowFetch(`https://api.platform.censys.io/v3/global/asset/host/${encodeURIComponent(ip)}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (response.status === 404) {
      return { hit: { source: "Censys", state: "clean", malicious: false, summary: "No Censys host record.", link: "https://search.censys.io/" }, banner: empty };
    }
    if (!response.ok) return { hit: failed("Censys"), banner: empty };
    const data = (await response.json()) as {
      result?: { resource?: { services?: { port?: number; jarm?: { fingerprint?: string }; cert?: { parsed?: { subject_dn?: string } }; http?: { headers?: Record<string, string> } }[]; labels?: string[] } };
    };
    const services = data.result?.resource?.services ?? [];
    const banner: HostBanner = { jarm: [], certs: [], headers: "", tags: data.result?.resource?.labels ?? [], rawSummary: "" };
    for (const service of services) {
      if (service.jarm?.fingerprint) banner.jarm.push(service.jarm.fingerprint);
      if (service.cert?.parsed?.subject_dn) banner.certs.push(service.cert.parsed.subject_dn);
      if (service.http?.headers) {
        banner.headers += Object.entries(service.http.headers)
          .map(([name, value]) => `${name}: ${value}`)
          .join("\n");
      }
    }
    const malware = banner.tags.some((tag) => /malware|c2|botnet/i.test(tag));
    banner.rawSummary = `${services.length} services. Labels ${banner.tags.join(", ") || "none"}.`;
    return {
      hit: {
        source: "Censys",
        state: "hit",
        malicious: malware ? true : null,
        summary: banner.rawSummary,
        link: `https://search.censys.io/hosts/${ip}`,
      },
      banner,
    };
  } catch {
    return { hit: failed("Censys"), banner: empty };
  }
}
