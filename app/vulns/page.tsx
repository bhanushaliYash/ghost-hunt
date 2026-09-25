"use client";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Table } from "@/components/ui/Table";
import { useEffect, useState } from "react";

type Advisory = { id: string; cve: string; summary: string; severity: string; cvss: number | null; patched: string; href: string };
type Issue = { id: string; title: string; severity: string; cvss: number | null; cves: string[]; url: string };

export default function VulnsPage() {
  const [name, setName] = useState("lodash");
  const [version, setVersion] = useState("4.17.21");
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/vulns")
      .then((response) => response.json())
      .then((body: { advisories?: Advisory[] }) => setAdvisories(body.advisories ?? []))
      .catch(() => setAdvisories([]));
  }, []);

  async function test(self = false) {
    const path = self ? "/api/vulns?self=1" : `/api/vulns?name=${encodeURIComponent(name)}&version=${encodeURIComponent(version)}`;
    const response = await fetch(path);
    const body = await response.json();
    setMessage(body.message || body.error || (body.checked ? `Checked ${body.checked}` : ""));
    setIssues(body.issues ?? body.self?.issues ?? []);
    if (body.advisories) setAdvisories(body.advisories);
  }

  return (
    <main className="page">
      <Breadcrumbs items={[{ href: "/", label: "Ghost Hunt" }, { label: "Vulns" }]} />
      <h1>Vulns</h1>
      <p className="quiet">Snyk tests one npm package. GitHub advisories are the public feed under it. Results are CVEs, not invented techniques.</p>
      <form
        className="row-actions"
        onSubmit={(event) => {
          event.preventDefault();
          void test(false);
        }}
      >
        <Field label="Package" value={name} onChange={(event) => setName(event.target.value)} />
        <Field label="Version" value={version} onChange={(event) => setVersion(event.target.value)} />
        <Button type="submit">Test package</Button>
        <Button type="button" tone="quiet" onClick={() => void test(true)}>
          Check one Ghost Hunt dependency
        </Button>
      </form>
      {message ? <p className="quiet">{message}</p> : null}
      <Table columns={["Issue", "Severity", "CVSS", "CVEs"]}>
        {issues.map((issue) => (
          <tr key={issue.id + issue.title}>
            <td>
              <a href={issue.url} target="_blank" rel="noreferrer">
                {issue.title}
              </a>
            </td>
            <td>{issue.severity}</td>
            <td>{issue.cvss ?? "–"}</td>
            <td className="mono">
              {issue.cves.map((cve) => (
                <a key={cve} href={`/cves?id=${cve}`}>
                  {cve}{" "}
                </a>
              ))}
            </td>
          </tr>
        ))}
      </Table>
      <h2>GitHub advisories</h2>
      <Table columns={["ID", "CVE", "CVSS", "Patched", "Summary"]}>
        {advisories.map((row) => (
          <tr key={row.id}>
            <td>
              <a href={row.href} target="_blank" rel="noreferrer">
                {row.id}
              </a>
            </td>
            <td className="mono">{row.cve ? <a href={`/cves?id=${row.cve}`}>{row.cve}</a> : "–"}</td>
            <td>{row.cvss ?? "–"}</td>
            <td className="mono">{row.patched}</td>
            <td>{row.summary}</td>
          </tr>
        ))}
      </Table>
    </main>
  );
}
