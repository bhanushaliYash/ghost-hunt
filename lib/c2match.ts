/**
 * Passive C2 check. We compare JARM, certificate subject, and HTTP
 * headers already collected by Shodan or Censys with a small published
 * signature file. We do not connect to the host ourselves.
 * A match is a lead. The summary says so.
 */

import signatures from "@/data/c2-signatures.json";
import type { HostBanner } from "./sources/shodan";
import type { SourceHit } from "./types";

type Signature = {
  name: string;
  jarm: string[];
  certIncludes: string[];
  headerIncludes: string[];
  note: string;
};

export function signatureCatalog(): Signature[] {
  return signatures as Signature[];
}

export function matchBanners(banners: HostBanner[]): SourceHit {
  const jarm = new Set(banners.flatMap((banner) => banner.jarm).map((item) => item.toLowerCase()));
  const certs = banners.flatMap((banner) => banner.certs).join("\n").toLowerCase();
  const headers = banners.map((banner) => banner.headers).join("\n").toLowerCase();
  const matched: Signature[] = [];
  for (const signature of signatureCatalog()) {
    const jarmHit = signature.jarm.some((item) => jarm.has(item.toLowerCase()));
    const certHit = signature.certIncludes.some((item) => certs.includes(item.toLowerCase()));
    const headerHit = signature.headerIncludes.length > 0 && signature.headerIncludes.every((item) => headers.includes(item.toLowerCase()));
    if (jarmHit || certHit || headerHit) matched.push(signature);
  }
  if (!banners.some((banner) => banner.jarm.length || banner.certs.length || banner.headers)) {
    return {
      source: "Signature match",
      state: "skipped",
      malicious: null,
      summary: "No JARM, certificate, or header banner came back to compare.",
    };
  }
  if (!matched.length) {
    return {
      source: "Signature match",
      state: "clean",
      malicious: false,
      summary: "No published C2 signature matched the banners. That does not clear the host.",
    };
  }
  return {
    source: "Signature match",
    state: "hit",
    malicious: true,
    summary: `Lead only: ${matched.map((item) => item.name).join("; ")}. ${matched[0].note}`,
  };
}
