/**
 * Patch-first CVE list.
 * CVSS says how bad a bug is on paper. CISA KEV says someone is already
 * using it. EPSS says how likely exploitation is. The home strip sorts
 * by that mix, not by publish time.
 * Patch URL is the first NVD reference tagged Patch, else Vendor Advisory.
 */

import sampleCve from "@/data/samples/cve.json";
import { cached } from "./cache";
import { allowFetch } from "./http";
import type { CveRow } from "./types";

type NvdRef = { url?: string; tags?: string[] };
type NvdCve = {
  id?: string;
  descriptions?: { lang?: string; value?: string }[];
  metrics?: Record<string, { cvssData?: { baseScore?: number; baseSeverity?: string; vectorString?: string } }[]>;
  references?: NvdRef[];
};

const SAMPLE = sampleCve as CveRow;

function cvssOf(cve: NvdCve): { score: number | null; severity: string; vector: string } {
  const metrics = cve.metrics ?? {};
  const blocks = [
    ...(metrics.cvssMetricV31 ?? []),
    ...(metrics.cvssMetricV30 ?? []),
    ...(metrics.cvssMetricV40 ?? []),
    ...(metrics.cvssMetricV2 ?? []),
  ];
  const data = blocks[0]?.cvssData;
  if (!data) return { score: null, severity: "UNKNOWN", vector: "" };
  return {
    score: typeof data.baseScore === "number" ? data.baseScore : null,
    severity: (data.baseSeverity || "UNKNOWN").toUpperCase(),
    vector: data.vectorString || "",
  };
}

function patchOf(refs: NvdRef[]): { url: string | null; label: string; references: { url: string; label: string }[] } {
  const references = refs
    .filter((ref) => ref.url)
    .map((ref) => ({ url: ref.url as string, label: (ref.tags && ref.tags[0]) || "Reference" }));
  const patch = refs.find((ref) => ref.tags?.includes("Patch") && ref.url);
  const vendor = refs.find((ref) => ref.tags?.includes("Vendor Advisory") && ref.url);
  if (patch?.url) return { url: patch.url, label: "Patch", references };
  if (vendor?.url) return { url: vendor.url, label: "Vendor advisory", references };
  return { url: null, label: "Patch not listed yet", references };
}

function rowFromNvd(cve: NvdCve, kev: Set<string>, epss: Map<string, number>): CveRow | null {
  if (!cve.id) return null;
  const description = cve.descriptions?.find((item) => item.lang === "en")?.value || "No English description.";
  const score = cvssOf(cve);
  const patch = patchOf(cve.references ?? []);
  return {
    id: cve.id,
    description: description.slice(0, 420),
    cvss: score.score,
    severity: score.severity,
    vector: score.vector,
    kev: kev.has(cve.id),
    epss: epss.get(cve.id) ?? null,
    patchUrl: patch.url,
    patchLabel: patch.label,
    references: patch.references.slice(0, 6),
  };
}

async function kevSet(): Promise<Set<string>> {
  return cached("kev", 6 * 60 * 60_000, async () => {
    const response = await allowFetch(
      "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
    );
    if (!response.ok) return new Set<string>();
    const body = (await response.json()) as { vulnerabilities?: { cveID?: string }[] };
    return new Set((body.vulnerabilities ?? []).map((row) => row.cveID).filter((id): id is string => Boolean(id)));
  });
}

async function epssFor(ids: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!ids.length) return map;
  const response = await allowFetch(`https://api.first.org/data/v1/epss?cve=${ids.map(encodeURIComponent).join(",")}`);
  if (!response.ok) return map;
  const body = (await response.json()) as { data?: { cve?: string; epss?: string }[] };
  for (const row of body.data ?? []) {
    if (row.cve && row.epss) map.set(row.cve, Number(row.epss));
  }
  return map;
}

async function nvdRecent(): Promise<NvdCve[]> {
  const end = new Date();
  const start = new Date(end.getTime() - 8 * 24 * 60 * 60_000);
  const stamp = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, ".000");
  const key = process.env.NVD_API_KEY;
  const headers: HeadersInit = key ? { apiKey: key } : {};
  const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=20&pubStartDate=${stamp(start)}&pubEndDate=${stamp(end)}`;
  const response = await allowFetch(url, { headers });
  if (!response.ok) throw new Error("nvd");
  const body = (await response.json()) as { vulnerabilities?: { cve?: NvdCve }[] };
  return (body.vulnerabilities ?? []).map((item) => item.cve).filter((item): item is NvdCve => Boolean(item));
}

async function nvdOne(id: string): Promise<NvdCve | null> {
  const key = process.env.NVD_API_KEY;
  const headers: HeadersInit = key ? { apiKey: key } : {};
  const response = await allowFetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(id)}`, {
    headers,
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { vulnerabilities?: { cve?: NvdCve }[] };
  return body.vulnerabilities?.[0]?.cve ?? null;
}

export function rankCve(row: CveRow): number {
  const kev = row.kev ? 1000 : 0;
  const epss = (row.epss ?? 0) * 200;
  const cvss = row.cvss ?? 0;
  return kev + epss + cvss;
}

export async function recentCves(): Promise<{ rows: CveRow[]; sample: boolean }> {
  try {
    const rows = await cached("cves", 20 * 60_000, async () => {
      const [nvd, kev] = await Promise.all([nvdRecent(), kevSet().catch(() => new Set<string>())]);
      const ids = nvd.map((cve) => cve.id).filter((id): id is string => Boolean(id));
      const epss = await epssFor(ids).catch(() => new Map<string, number>());
      const rows = nvd
        .map((cve) => rowFromNvd(cve, kev, epss))
        .filter((row): row is CveRow => Boolean(row))
        .sort((a, b) => rankCve(b) - rankCve(a));
      if (!rows.length) throw new Error("no cves");
      return rows;
    });
    return { rows, sample: false };
  } catch {
    return { rows: [SAMPLE], sample: true };
  }
}

export async function cvesMentioned(text: string): Promise<CveRow[]> {
  const ids = Array.from(new Set(text.match(/CVE-\d{4}-\d{4,}/gi) ?? [])).map((id) => id.toUpperCase()).slice(0, 3);
  if (!ids.length) return [];
  const kev = await kevSet().catch(() => new Set<string>());
  const epss = await epssFor(ids).catch(() => new Map<string, number>());
  const rows: CveRow[] = [];
  for (const id of ids) {
    try {
      const cve = await nvdOne(id);
      const row = cve ? rowFromNvd(cve, kev, epss) : null;
      if (row) rows.push(row);
    } catch {
      if (id === SAMPLE.id) rows.push(SAMPLE);
    }
  }
  return rows;
}
