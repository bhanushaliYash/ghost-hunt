/**
 * Neon holds pinned cases and nothing else.
 * The Lab page does not read this table. If DATABASE_URL is unset,
 * pins stay hidden and the rest of the app still runs.
 */

import { neon } from "@neondatabase/serverless";

export function pinsEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

let ready = false;

async function ensureTable() {
  const db = sql();
  if (!db) return null;
  if (!ready) {
    await db`CREATE TABLE IF NOT EXISTS pins (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      indicator text NOT NULL,
      score integer NOT NULL,
      note text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    ready = true;
  }
  return db;
}

export async function listPins(): Promise<{ id: number; indicator: string; score: number; note: string; createdAt: string }[]> {
  const db = await ensureTable();
  if (!db) return [];
  const rows = (await db`SELECT id, indicator, score, note, created_at FROM pins ORDER BY created_at DESC LIMIT 20`) as Record<
    string,
    unknown
  >[];
  return rows.map((row) => ({
    id: Number(row.id),
    indicator: String(row.indicator),
    score: Number(row.score),
    note: String(row.note),
    createdAt: new Date(row.created_at as string).toISOString(),
  }));
}

export async function addPin(indicator: string, score: number, note: string): Promise<void> {
  const db = await ensureTable();
  if (!db) throw new Error("Pins are off.");
  await db`INSERT INTO pins (indicator, score, note) VALUES (${indicator}, ${score}, ${note})`;
}
