/**
 * One indicator in, one case card out.
 * Sources run together. A source that fails becomes a row, not a 500.
 * The sample dissent is added only when GreyNoise did not answer, so the
 * live demo can show a disagreement without inventing a live result.
 */

import manifest from "@/data/samples/manifest.json";
import { writeBrief } from "./brief";
import { matchBanners } from "./c2match";
import { cvesMentioned } from "./cve";
import { indexLookup } from "./elastic";
import { pinsEnabled } from "./db";
import { matchMalware } from "./mitre";
import { scoreHits } from "./score";
import { classifyIndicator } from "./security";
import { abuseipdbHit } from "./sources/abuseipdb";
import { censysHost } from "./sources/censys";
import { feodoHit } from "./sources/feodo";
import { geoLabel } from "./sources/geoip";
import { greynoiseHit } from "./sources/greynoise";
import { malwarebazaarLookup } from "./sources/malwarebazaar";
import { otxHit } from "./sources/otx";
import { shodanHost } from "./sources/shodan";
import type { HostBanner } from "./sources/shodan";
import { threatfoxHit } from "./sources/threatfox";
import { urlhausHit } from "./sources/urlhaus";
import { virusTotalHit } from "./sources/virustotal";
import type { LookupResult, SourceHit } from "./types";

const dissent = manifest.dissent as SourceHit;

export async function lookupIndicator(raw: string): Promise<LookupResult> {
  const { type, value } = classifyIndicator(raw);
  const hits: SourceHit[] = [];
  const families: string[] = [];
  let geo = "";
  const banners: HostBanner[] = [];

  if (type === "ip") {
    const [feodo, fox, haus, abuse, otx, vt, noise, shodan, censys, where] = await Promise.all([
      feodoHit(value),
      threatfoxHit(value),
      urlhausHit("host", value),
      abuseipdbHit(value),
      otxHit(type, value),
      virusTotalHit(type, value),
      greynoiseHit(value),
      shodanHost(value),
      censysHost(value),
      geoLabel(value),
    ]);
    hits.push(feodo, fox, haus, abuse, otx, vt, noise, shodan.hit, censys.hit);
    banners.push(shodan.banner, censys.banner);
    hits.push(matchBanners(banners));
    geo = where;
    if (feodo.malicious) families.push(feodo.summary.split(" ")[0]);
    if (value === manifest.ip && noise.state === "skipped") hits.push(dissent);
  } else if (type === "domain") {
    const [haus, fox, otx, vt] = await Promise.all([
      urlhausHit("host", value),
      threatfoxHit(value),
      otxHit(type, value),
      virusTotalHit(type, value),
    ]);
    hits.push(haus, fox, otx, vt);
  } else if (type === "url") {
    const host = new URL(value).hostname;
    const [haus, fox, otx, vt] = await Promise.all([
      urlhausHit("url", value),
      threatfoxHit(host),
      otxHit(type, value),
      virusTotalHit(type, value),
    ]);
    hits.push(haus, fox, otx, vt);
  } else if (type === "hash") {
    const [bazaar, fox, otx, vt] = await Promise.all([
      malwarebazaarLookup(value),
      threatfoxHit(value),
      otxHit(type, value),
      virusTotalHit(type, value),
    ]);
    hits.push(bazaar.hit, fox, otx, vt);
    if (bazaar.family) families.push(bazaar.family);
  } else {
    hits.push({
      source: "CVE catalog",
      state: "hit",
      malicious: null,
      summary: "Open this CVE on the CVE page for CVSS, KEV, EPSS, and the patch link.",
      link: `/cves?id=${encodeURIComponent(value)}`,
    });
  }

  const linked = matchMalware(families);
  const blob = hits.map((hit) => hit.summary).join(" ");
  const cves = type === "cve" ? await cvesMentioned(value) : await cvesMentioned(blob);
  const score = scoreHits(hits);
  const brief = await writeBrief({ indicator: value, type, hits, score, malware: linked.malware, techniques: linked.techniques, cves });
  if (process.env.ELASTIC_URL) {
    indexLookup({ indicator: value, indicatorType: type, score: score.score, confidence: score.confidence }).catch(() => undefined);
  }

  return {
    indicator: value,
    type,
    hits,
    score,
    geo,
    malware: linked.malware,
    techniques: linked.techniques,
    cves,
    brief,
    sample: hits.some((hit) => hit.state === "sample"),
    pinsEnabled: pinsEnabled(),
  };
}
