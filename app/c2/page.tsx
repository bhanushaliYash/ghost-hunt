"use client";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Table } from "@/components/ui/Table";
import { SAMPLE_IP } from "@/lib/samples";
import type { SourceHit } from "@/lib/types";
import { useEffect, useState } from "react";

type Row = { ip_address: string; port: number; status: string; malware: string; country: string };
type Sig = { name: string; jarm: string[]; note: string };
type Payload = {
  sample?: boolean;
  rows: Row[];
  catalog: Sig[];
  host: { shodan: SourceHit; censys: SourceHit; match: SourceHit } | null;
  search: { ok: boolean; message: string; matches: { ip: string; port: number }[] } | null;
};

export default function C2Page() {
  const [data, setData] = useState<Payload | null>(null);
  const [ip, setIp] = useState(SAMPLE_IP);
  const [error, setError] = useState("");

  async function load(query: string) {
    setError("");
    const response = await fetch(`/api/c2${query}`);
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "C2 page failed.");
      return;
    }
    setData(body as Payload);
  }

  useEffect(() => {
    void load("");
  }, []);

  return (
    <main className="page">
      <Breadcrumbs items={[{ href: "/", label: "Ghost Hunt" }, { label: "C2" }]} />
      <h1>C2</h1>
      <p className="quiet">
        This page reads public C2 lists and banners Shodan or Censys already collected. It does not connect to hosts on the internet.
        A JARM hit is a lead, not proof.
      </p>
      {data?.sample ? <p className="chip sample">Feodo sample</p> : null}
      {error ? <p className="quiet">{error}</p> : null}
      <form
        className="row-actions"
        onSubmit={(event) => {
          event.preventDefault();
          void load(`?q=${encodeURIComponent(ip)}`);
        }}
      >
        <Field label="IP" value={ip} onChange={(event) => setIp(event.target.value)} />
        <Button type="submit">Check banners</Button>
        <Button type="button" tone="quiet" onClick={() => void load("?search=1")}>
          Run one JARM search
        </Button>
      </form>
      {data?.host ? (
        <Table columns={["Source", "State", "Summary"]}>
          {[data.host.shodan, data.host.censys, data.host.match].map((hit) => (
            <tr key={hit.source}>
              <td>{hit.source}</td>
              <td>{hit.state}</td>
              <td>{hit.summary}</td>
            </tr>
          ))}
        </Table>
      ) : null}
      {data?.search ? (
        <section>
          <h2>Saved query</h2>
          <p>{data.search.message}</p>
          <ul className="list">
            {data.search.matches.map((match) => (
              <li key={`${match.ip}:${match.port}`}>
                <a href={`/lookup?q=${match.ip}`}>{match.ip}</a>
                <span className="meta">port {match.port}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <h2>Signature catalog</h2>
      <Table columns={["Name", "JARM", "Note"]}>
        {(data?.catalog ?? []).map((row) => (
          <tr key={row.name}>
            <td>{row.name}</td>
            <td className="mono">{row.jarm[0] || "header or cert"}</td>
            <td>{row.note}</td>
          </tr>
        ))}
      </Table>
      <h2>Live C2 list</h2>
      <Table columns={["IP", "Port", "Status", "Malware", "Country"]}>
        {(data?.rows ?? []).map((row) => (
          <tr key={row.ip_address}>
            <td className="mono">
              <a href={`/lookup?q=${row.ip_address}`}>{row.ip_address}</a>
            </td>
            <td>{row.port}</td>
            <td>{row.status}</td>
            <td>{row.malware}</td>
            <td>{row.country}</td>
          </tr>
        ))}
      </Table>
    </main>
  );
}
