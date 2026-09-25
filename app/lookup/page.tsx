"use client";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Table } from "@/components/ui/Table";
import { techniqueUrl } from "@/lib/mitre";
import { SAMPLE_IP } from "@/lib/samples";
import type { LookupResult } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function scoreClass(score: number): string {
  if (score >= 70) return "score-num bad";
  if (score >= 40) return "score-num warn";
  return "score-num";
}

function Lookup() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pinMsg, setPinMsg] = useState("");

  async function run(value: string) {
    setError("");
    setPinMsg("");
    const response = await fetch(`/api/lookup?q=${encodeURIComponent(value)}`);
    const body = await response.json();
    if (!response.ok) {
      setResult(null);
      setError(body.error || "Lookup failed.");
      return;
    }
    setResult(body as LookupResult);
  }

  useEffect(() => {
    if (initial) void run(initial);
    // The query string is the demo entry point from the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  return (
    <main className="page">
      <Breadcrumbs items={[{ href: "/", label: "Ghost Hunt" }, { label: "Lookup" }, ...(result ? [{ label: result.indicator }] : [])]} />
      <h1>Lookup</h1>
      <form
        className="row-actions"
        onSubmit={(event) => {
          event.preventDefault();
          void run(q);
        }}
      >
        <Field label="Indicator" value={q} onChange={(event) => setQ(event.target.value)} placeholder="IP, domain, URL, hash, or CVE" />
        <Button type="submit">Score</Button>
        <Button type="button" tone="quiet" onClick={() => { setQ(SAMPLE_IP); void run(SAMPLE_IP); }}>
          Use sample IP
        </Button>
      </form>
      {error ? <p className="quiet">{error}</p> : null}
      {result ? (
        <>
          {result.sample ? <p className="chip sample">Sample source in this card</p> : null}
          <div className="split">
            <Card title="Threat score">
              <div className={scoreClass(result.score.score)}>{result.score.score}</div>
              <p className="quiet">Confidence {result.score.confidence}</p>
              <p className="mono">{result.geo || result.type}</p>
            </Card>
            <Card title="Case">
              <p>
                {result.malware.length ? `Family: ${result.malware.join(", ")}. ` : "No malware family tied to the local ATT&CK index. "}
                {result.techniques.map((item) => (
                  <a key={item.id} className="mitre" href={techniqueUrl(item.id)} title={item.description}>
                    {item.id} {item.name}.{" "}
                  </a>
                ))}
              </p>
              {result.cves.map((cve) => (
                <p key={cve.id}>
                  <a href={`/cves?id=${cve.id}`}>{cve.id}</a> CVSS {cve.cvss ?? "–"} {cve.kev ? "KEV" : ""}{" "}
                  {cve.patchUrl ? (
                    <a href={cve.patchUrl} target="_blank" rel="noreferrer">
                      {cve.patchLabel}
                    </a>
                  ) : null}
                </p>
              ))}
              <h2>Disposition</h2>
              {result.brief.available ? (
                result.brief.lines.map((line) => <p key={line}>{line}</p>)
              ) : (
                <p className="quiet">{result.brief.note}</p>
              )}
              {result.score.disagreements.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </Card>
          </div>
          <Table columns={["Source", "State", "Vote", "Why"]}>
            {result.hits.map((hit) => (
              <tr key={hit.source}>
                <td>{hit.link ? <a href={hit.link}>{hit.source}</a> : hit.source}</td>
                <td>{hit.state === "sample" ? <span className="chip sample">sample</span> : hit.state}</td>
                <td>{hit.malicious === true ? "malicious" : hit.malicious === false ? "clean" : "–"}</td>
                <td>{hit.summary}</td>
              </tr>
            ))}
          </Table>
          {result.pinsEnabled ? (
            <form
              className="row-actions"
              onSubmit={async (event) => {
                event.preventDefault();
                const response = await fetch("/api/pins", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ indicator: result.indicator, score: result.score.score, note }),
                });
                const body = await response.json();
                setPinMsg(response.ok ? "Pinned." : body.error || "Pin failed.");
              }}
            >
              <Field label="Note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Short note" />
              <Button type="submit" tone="quiet">
                Pin case
              </Button>
              {pinMsg ? <span className="quiet">{pinMsg}</span> : null}
            </form>
          ) : (
            <p className="quiet">Pins are hidden until DATABASE_URL points at Neon.</p>
          )}
        </>
      ) : null}
    </main>
  );
}

export default function LookupPage() {
  return (
    <Suspense fallback={<main className="page">Loading lookup…</main>}>
      <Lookup />
    </Suspense>
  );
}
