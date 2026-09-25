"use client";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Area } from "@/components/ui/Field";
import { Table } from "@/components/ui/Table";
import { SAMPLE_HEADER } from "@/lib/samples";
import { useState } from "react";

type Report = {
  from: string;
  returnPath: string;
  subject: string;
  spf: string;
  dkim: string;
  dmarc: string;
  alignment: string[];
  hops: { index: number; from: string; by: string; ip: string }[];
  indicators: { value: string; type: string }[];
};

export default function MailPage() {
  const [header, setHeader] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  async function parse(text: string) {
    setError("");
    const response = await fetch("/api/mail", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ header: text }),
    });
    const body = await response.json();
    if (!response.ok) {
      setReport(null);
      setError(body.error || "Could not read headers.");
      return;
    }
    setReport(body as Report);
  }

  return (
    <main className="page">
      <Breadcrumbs items={[{ href: "/", label: "Ghost Hunt" }, { label: "Mail" }]} />
      <h1>Mail headers</h1>
      <p className="quiet">Paste a header block. Ghost Hunt reads hops and authentication results. It does not open links inside the mail.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void parse(header);
        }}
      >
        <Area label="Headers" value={header} onChange={(event) => setHeader(event.target.value)} />
        <div className="row-actions">
          <Button type="submit">Read headers</Button>
          <Button
            type="button"
            tone="quiet"
            onClick={() => {
              setHeader(SAMPLE_HEADER);
              void parse(SAMPLE_HEADER);
            }}
          >
            Use sample header
          </Button>
        </div>
      </form>
      {error ? <p className="quiet">{error}</p> : null}
      {report ? (
        <>
          <p>
            From {report.from || "–"} · Return-Path {report.returnPath || "–"}
          </p>
          <p className="mono">
            SPF {report.spf} · DKIM {report.dkim} · DMARC {report.dmarc}
          </p>
          {report.alignment.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <h2>Hops</h2>
          <Table columns={["#", "From", "By", "IP"]}>
            {report.hops.map((hop) => (
              <tr key={hop.index}>
                <td>{hop.index}</td>
                <td className="mono">{hop.from}</td>
                <td className="mono">{hop.by}</td>
                <td className="mono">{hop.ip ? <a href={`/lookup?q=${hop.ip}`}>{hop.ip}</a> : "–"}</td>
              </tr>
            ))}
          </Table>
          <h2>Indicators</h2>
          <ul className="list">
            {report.indicators.map((item) => (
              <li key={item.value}>
                <a href={`/lookup?q=${encodeURIComponent(item.value)}`}>{item.value}</a>
                <span className="meta">{item.type}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </main>
  );
}
