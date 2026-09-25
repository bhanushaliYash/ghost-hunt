"use client";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DataList } from "@/components/ui/DataList";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Item = { title: string; href: string; when: string };
type Payload = { source: { id: string; name: string; home: string }; items: Item[] };

export default function IntelSourcePage() {
  const params = useParams<{ source: string }>();
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    fetch(`/api/intel?source=${encodeURIComponent(params.source)}`)
      .then((response) => response.json())
      .then((body: Payload) => setData(body))
      .catch(() => setData(null));
  }, [params.source]);

  return (
    <main className="page">
      <Breadcrumbs
        items={[
          { href: "/", label: "Ghost Hunt" },
          { href: "/intel", label: "Intel" },
          { label: data?.source.name || params.source },
        ]}
      />
      <h1>{data?.source.name || "Source"}</h1>
      {data?.source.home ? (
        <p>
          <a href={data.source.home} target="_blank" rel="noreferrer">
            Homepage
          </a>
        </p>
      ) : null}
      <DataList items={(data?.items ?? []).map((item) => ({ href: item.href, title: item.title, meta: item.when }))} />
    </main>
  );
}
