"use client";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useEffect, useState } from "react";

type Source = { id: string; name: string; home: string };

export default function IntelPage() {
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    fetch("/api/intel")
      .then((response) => response.json())
      .then((body: Source[]) => setSources(body))
      .catch(() => setSources([]));
  }, []);

  return (
    <main className="page">
      <Breadcrumbs items={[{ href: "/", label: "Ghost Hunt" }, { label: "Intel" }]} />
      <h1>Intel</h1>
      <p className="quiet">Homepages and a latest-item page for each feed.</p>
      <ul className="list">
        {sources.map((source) => (
          <li key={source.id}>
            <span>
              {source.name}{" "}
              <a href={`/intel/${source.id}`}>Latest</a>
            </span>
            <a className="meta" href={source.home} target="_blank" rel="noreferrer">
              Homepage
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
