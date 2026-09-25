"use client";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { DataList } from "@/components/ui/DataList";
import { Field } from "@/components/ui/Field";
import { MitreText } from "@/components/MitreText";
import { useState } from "react";

type Hit = { kind: string; id: string; name: string; description: string; href: string };
type Headline = { title: string; href: string; source: string };

export default function HuntPage() {
  const [q, setQ] = useState("Cobalt Strike");
  const [hits, setHits] = useState<Hit[]>([]);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [error, setError] = useState("");

  async function search(value: string) {
    setError("");
    const response = await fetch(`/api/hunt?q=${encodeURIComponent(value)}`);
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "Search failed.");
      return;
    }
    setHits(body.mitre ?? []);
    setHeadlines(body.headlines ?? []);
  }

  return (
    <main className="page">
      <Breadcrumbs items={[{ href: "/", label: "Ghost Hunt" }, { label: "Hunt" }]} />
      <h1>Hunt</h1>
      <p className="quiet">Search a group, malware family, or technique. Snippets come from the local ATT&CK index and current headlines.</p>
      <form
        className="row-actions"
        onSubmit={(event) => {
          event.preventDefault();
          void search(q);
        }}
      >
        <Field label="Attack" value={q} onChange={(event) => setQ(event.target.value)} />
        <Button type="submit">Search</Button>
      </form>
      {error ? <p className="quiet">{error}</p> : null}
      <ul className="list">
        {hits.map((hit) => (
          <li key={hit.id}>
            <span>
              <a href={hit.href} target="_blank" rel="noreferrer">
                {hit.name}
              </a>{" "}
              <span className="mono">{hit.id}</span>
              <br />
              <MitreText text={hit.description} />
            </span>
            <span className="meta">{hit.kind}</span>
          </li>
        ))}
      </ul>
      <h2>Headlines</h2>
      <DataList items={headlines.map((item) => ({ href: item.href, title: item.title, meta: item.source }))} />
    </main>
  );
}
