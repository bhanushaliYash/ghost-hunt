"use client";

/**
 * Elasticsearch hunt lab. This list is not the Neon pin table.
 */

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Table } from "@/components/ui/Table";
import { useEffect, useState } from "react";

type Row = { indicator: string; indicatorType: string; score: number; at: string };

export default function LabPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState("Checking the lab…");

  useEffect(() => {
    fetch("/api/lab")
      .then((response) => response.json())
      .then((body: { rows: Row[]; message: string }) => {
        setRows(body.rows ?? []);
        setMessage(body.message || "");
      })
      .catch(() => setMessage("Lab request failed."));
  }, []);

  return (
    <main className="page">
      <Breadcrumbs items={[{ href: "/", label: "Ghost Hunt" }, { label: "Lab" }]} />
      <h1>Lab</h1>
      <p className="quiet">Recent lookups indexed in local Elasticsearch. Pinned cases stay in Neon and are not shown here.</p>
      {message ? <p>{message}</p> : null}
      <Table columns={["When", "Type", "Indicator", "Score"]}>
        {rows.map((row) => (
          <tr key={row.at + row.indicator}>
            <td className="mono">{row.at}</td>
            <td>{row.indicatorType}</td>
            <td className="mono">
              <a href={`/lookup?q=${encodeURIComponent(row.indicator)}`}>{row.indicator}</a>
            </td>
            <td>{row.score}</td>
          </tr>
        ))}
      </Table>
    </main>
  );
}
