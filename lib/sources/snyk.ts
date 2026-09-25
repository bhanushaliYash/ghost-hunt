/**
 * Snyk v1 npm test. Open-source package lookup with a free token.
 * This is vulnerability management: CVE and CVSS, not an ATT&CK technique.
 * https://docs.snyk.io/snyk-api/reference/test-v1
 */

import { allowFetch } from "../http";

export type SnykIssue = {
  id: string;
  title: string;
  severity: string;
  cvss: number | null;
  cves: string[];
  url: string;
};

export async function snykTest(name: string, version: string): Promise<{ ok: boolean; message: string; issues: SnykIssue[] }> {
  const token = process.env.SNYK_TOKEN;
  if (!token) {
    return { ok: false, message: "Add SNYK_TOKEN to test a package. The free token is a server secret.", issues: [] };
  }
  try {
    const response = await allowFetch(`https://api.snyk.io/v1/test/npm/${encodeURIComponent(name)}/${encodeURIComponent(version)}`, {
      headers: { authorization: `token ${token}` },
    });
    if (!response.ok && response.status !== 200) {
      const text = await response.text();
      if (response.status === 404) return { ok: true, message: "Snyk returned no issues for that package.", issues: [] };
      return { ok: false, message: `Snyk answered ${response.status}. ${text.slice(0, 140)}`, issues: [] };
    }
    const data = (await response.json()) as {
      issues?: { vulnerabilities?: { id?: string; title?: string; severity?: string; cvssScore?: number; identifiers?: { CVE?: string[] }; url?: string }[] };
    };
    const issues = (data.issues?.vulnerabilities ?? []).slice(0, 20).map((issue) => ({
      id: issue.id || "",
      title: issue.title || "Issue",
      severity: issue.severity || "",
      cvss: typeof issue.cvssScore === "number" ? issue.cvssScore : null,
      cves: issue.identifiers?.CVE ?? [],
      url: issue.url || "https://snyk.io/vuln/",
    }));
    return { ok: true, message: issues.length ? `${issues.length} issues.` : "No issues returned.", issues };
  } catch {
    return { ok: false, message: "Snyk did not answer.", issues: [] };
  }
}
