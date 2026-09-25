"use client";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { MitreText } from "@/components/MitreText";
import type { CveRow } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CveBrowser() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("id") ?? "");
  const [severity, setSeverity] = useState("");
  const [kev, setKev] = useState(false);
  const [rows, setRows] = useState<CveRow[]>([]);
  const [open, setOpen] = useState(params.get("id") ?? "");
  const [sample, setSample] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (severity) query.set("severity", severity);
    if (kev) query.set("kev", "1");
    fetch(`/api/cves?${query.toString()}`)
      .then((response) => response.json())
      .then((body: { rows: CveRow[]; sample?: boolean }) => {
        setRows(body.rows ?? []);
        setSample(Boolean(body.sample));
      })
      .catch(() => setRows([]));
  }, [q, severity, kev]);

  const current = rows.find((row) => row.id === open);

  return (
    <main className="page">
      <Breadcrumbs items={[{ href: "/", label: "Ghost Hunt" }, { label: "CVEs" }, ...(current ? [{ label: current.id }] : [])]} />
      <h1>CVEs</h1>
      <p className="quiet">Sorted by exploited-in-the-wild, then EPSS, then CVSS. Patch links come from NVD tags.</p>
      {sample ? <p className="chip sample">Sample record, live NVD did not answer</p> : null}
      <form
        className="filters"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setQ(String(data.get("q") ?? ""));
          setSeverity(String(data.get("severity") ?? ""));
          setKev(data.get("kev") === "on");
        }}
      >
        <Field label="Search" name="q" defaultValue={q} placeholder="CVE or keyword" />
        <Select label="Severity" name="severity" defaultValue={severity}>
          <option value="">Any</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </Select>
        <label className="lbl">
          KEV only
          <input name="kev" type="checkbox" defaultChecked={kev} />
        </label>
        <Button type="submit">Filter</Button>
      </form>
      <Table columns={["CVE", "CVSS", "Vector", "KEV", "EPSS", "Patch"]}>
        {rows.map((row) => (
          <tr key={row.id} className={open === row.id ? "open" : ""} onClick={() => setOpen(row.id)}>
            <td className="mono">{row.id}</td>
            <td>
              {row.cvss ?? "–"} {row.severity}
            </td>
            <td className="mono">{row.vector || "–"}</td>
            <td>{row.kev ? "Yes" : "No"}</td>
            <td className="mono">{row.epss === null ? "–" : `${Math.round(row.epss * 100)}%`}</td>
            <td>
              {row.patchUrl ? (
                <a href={row.patchUrl} target="_blank" rel="noreferrer">
                  {row.patchLabel}
                </a>
              ) : (
                row.patchLabel
              )}
            </td>
          </tr>
        ))}
      </Table>
      {current ? (
        <section>
          <h2>{current.id}</h2>
          <p>
            <MitreText text={current.description} />
          </p>
          <ul className="list">
            {current.references.map((ref) => (
              <li key={ref.url}>
                <a href={ref.url} target="_blank" rel="noreferrer">
                  {ref.label}
                </a>
                <span className="meta mono">{ref.url}</span>
              </li>
            ))}
            <li>
              <a href={`https://nvd.nist.gov/vuln/detail/${current.id}`} target="_blank" rel="noreferrer">
                NVD
              </a>
              <span className="meta">full record</span>
            </li>
          </ul>
        </section>
      ) : null}
    </main>
  );
}

export default function CvePage() {
  return (
    <Suspense fallback={<main className="page">Loading CVEs…</main>}>
      <CveBrowser />
    </Suspense>
  );
}
