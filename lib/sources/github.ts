/**
 * GitHub Security Advisories. Public, no token required for a short list.
 * https://docs.github.com/en/rest/security-advisories
 */

import { cached } from "../cache";
import { allowFetch } from "../http";

export type Advisory = {
  id: string;
  cve: string;
  summary: string;
  severity: string;
  cvss: number | null;
  patched: string;
  href: string;
};

export async function latestAdvisories(): Promise<Advisory[]> {
  return cached("ghsa", 20 * 60_000, async () => {
    const response = await allowFetch("https://api.github.com/advisories?per_page=8", {
      headers: { accept: "application/vnd.github+json" },
    });
    if (!response.ok) return [];
    const rows = (await response.json()) as {
      ghsa_id?: string;
      cve_id?: string;
      summary?: string;
      severity?: string;
      cvss?: { score?: number };
      html_url?: string;
      vulnerabilities?: { package?: { name?: string }; patched_versions?: string }[];
    }[];
    return rows.map((row) => ({
      id: row.ghsa_id || "",
      cve: row.cve_id || "",
      summary: (row.summary || "").slice(0, 220),
      severity: row.severity || "",
      cvss: row.cvss?.score ?? null,
      patched: row.vulnerabilities?.map((item) => item.patched_versions).filter(Boolean).join(", ") || "Not listed",
      href: row.html_url || "https://github.com/advisories",
    }));
  });
}
