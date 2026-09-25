"use client";

/**
 * Shift board. The first sentence is the problem the demo opens with.
 * Map, feed, named attacks, and the patch strip are the working surface.
 */

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DataList } from "@/components/ui/DataList";
import { Table } from "@/components/ui/Table";
import { MitreText } from "@/components/MitreText";
import { ThreatMap } from "@/components/MapLoader";
import type { AttackItem, CveRow, FeedItem, MapPoint } from "@/lib/types";
import { useEffect, useState } from "react";

type Board = { points: MapPoint[]; feed: FeedItem[]; attacks: AttackItem[]; cves: CveRow[]; sample: string[] };

export default function HomePage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/home")
      .then(async (response) => {
        if (!response.ok) throw new Error("Home feed failed.");
        setBoard((await response.json()) as Board);
      })
      .catch(() => setError("The board could not load."));
  }, []);

  return (
    <main className="page">
      <Breadcrumbs items={[{ label: "Ghost Hunt" }]} />
      <h1>Ghost Hunt</h1>
      <p className="lede">
        An Optiv fusion-center analyst on shift cannot say, in the first two minutes, whether a hash, IP, domain, or
        phish header is worth escalating and what to patch, because that answer is split across intel tabs, MITRE, NVD,
        and mail tools.
      </p>
      <p className="quiet">User: the analyst triaging an indicator during a live hunt.</p>
      {board?.sample.length ? <p className="chip sample">Sample: {board.sample.join(", ")}</p> : null}
      {error ? <p className="quiet">{error}</p> : null}
      <div className="figures">
        <div>
          <b>{board?.points.length ?? "–"}</b>
          <span>map points</span>
        </div>
        <div>
          <b>{board?.feed.length ?? "–"}</b>
          <span>feed rows</span>
        </div>
        <div>
          <b>{board?.cves.length ?? "–"}</b>
          <span>patch queue</span>
        </div>
      </div>
      <div className="map-wrap">{board ? <ThreatMap points={board.points} /> : <p className="quiet">Loading map…</p>}</div>
      <div className="grid-2">
        <section>
          <h2>Threat feed</h2>
          <DataList
            items={(board?.feed ?? []).map((row) => ({
              href: row.href,
              title: row.indicator,
              meta: `${row.detail} · ${row.source}`,
            }))}
          />
        </section>
        <section>
          <h2>Named attacks</h2>
          <DataList
            items={(board?.attacks ?? []).map((row) => ({
              href: row.href,
              title: row.name,
              meta: row.detail,
            }))}
          />
        </section>
      </div>
      <h2>Patch these first</h2>
      <Table columns={["CVE", "CVSS", "KEV", "EPSS", "Patch", "Why"]}>
        {(board?.cves ?? []).map((row) => (
          <tr key={row.id}>
            <td className="mono">
              <a href={`/cves?id=${encodeURIComponent(row.id)}`}>{row.id}</a>
              {row.sample ? <span className="chip sample">sample</span> : null}
            </td>
            <td>
              <span className="chip cvss">{row.cvss ?? "–"}</span> {row.severity}
            </td>
            <td>{row.kev ? <span className="chip kev">KEV</span> : "–"}</td>
            <td className="mono">{row.epss === null ? "–" : `${Math.round(row.epss * 100)}%`}</td>
            <td>
              {row.patchUrl ? (
                <a href={row.patchUrl} target="_blank" rel="noreferrer">
                  {row.patchLabel}
                </a>
              ) : (
                <a href={`https://nvd.nist.gov/vuln/detail/${row.id}`} target="_blank" rel="noreferrer">
                  {row.patchLabel}
                </a>
              )}
            </td>
            <td>
              <MitreText text={row.description} />
            </td>
          </tr>
        ))}
      </Table>
    </main>
  );
}
