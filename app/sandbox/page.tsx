"use client";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SAMPLE_HASH } from "@/lib/samples";
import type { SourceHit } from "@/lib/types";
import { useState } from "react";

export default function SandboxPage() {
  const [hash, setHash] = useState(SAMPLE_HASH);
  const [bazaar, setBazaar] = useState<SourceHit | null>(null);
  const [anyrun, setAnyrun] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  async function run(value: string) {
    setError("");
    const response = await fetch(`/api/sandbox?hash=${encodeURIComponent(value)}`);
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "Sandbox lookup failed.");
      return;
    }
    setBazaar(body.bazaar);
    setAnyrun(body.anyrun);
    setUrl(body.anyrunUrl);
  }

  return (
    <main className="page">
      <Breadcrumbs items={[{ href: "/", label: "Ghost Hunt" }, { label: "Sandbox" }]} />
      <h1>Sandbox</h1>
      <p className="quiet">MalwareBazaar answers when an abuse.ch key is set. ANY.RUN opens in the browser because the API is not on the free plan.</p>
      <form
        className="row-actions"
        onSubmit={(event) => {
          event.preventDefault();
          void run(hash);
        }}
      >
        <Field label="Hash" value={hash} onChange={(event) => setHash(event.target.value)} />
        <Button type="submit">Look up hash</Button>
        <Button type="button" tone="quiet" onClick={() => { setHash(SAMPLE_HASH); void run(SAMPLE_HASH); }}>
          Use sample hash
        </Button>
      </form>
      {error ? <p className="quiet">{error}</p> : null}
      {bazaar ? (
        <Card title="MalwareBazaar">
          <p>
            {bazaar.state}: {bazaar.summary}
          </p>
          {bazaar.link ? (
            <a href={bazaar.link} target="_blank" rel="noreferrer">
              Open record
            </a>
          ) : null}
        </Card>
      ) : null}
      {anyrun ? (
        <Card title="ANY.RUN">
          <p>{anyrun}</p>
          {url ? (
            <a href={url} target="_blank" rel="noreferrer">
              Open ANY.RUN
            </a>
          ) : null}
          <p className="mono">{hash}</p>
        </Card>
      ) : null}
    </main>
  );
}
