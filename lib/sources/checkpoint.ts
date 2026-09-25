/**
 * Check Point live threat map feed. No API key.
 * https://threatmap-api.checkpoint.com/ThreatMap/api/feed
 * Events already carry source and destination coordinates, so the map
 * does not guess a country center. Radware's tiles were asking for a key;
 * this feed does not.
 */

import { assertAllowed } from "../security";
import type { LiveAttack } from "./radware";

const FEED = "https://threatmap-api.checkpoint.com/ThreatMap/api/feed";

type EventRow = {
  a_n?: string;
  a_t?: string;
  a_c?: number;
  s_co?: string;
  d_co?: string;
  s_la?: number;
  s_lo?: number;
  d_la?: number;
  d_lo?: number;
};

let memory: { at: number; attacks: LiveAttack[] } | null = null;

export async function checkpointAttacks(): Promise<LiveAttack[]> {
  if (memory && Date.now() - memory.at < 20_000 && memory.attacks.length) return memory.attacks;
  const attacks = await pullFeed();
  const combined = [...attacks, ...(memory?.attacks ?? [])].slice(0, 40);
  if (combined.length) memory = { at: Date.now(), attacks: combined };
  return memory?.attacks ?? [];
}

async function pullFeed(): Promise<LiveAttack[]> {
  assertAllowed(FEED);
  const attacks: LiveAttack[] = [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(FEED, {
      headers: { accept: "text/event-stream", "user-agent": "ghost-hunt/0.1" },
      signal: controller.signal,
    });
    if (!response.ok || !response.body) return attacks;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (attacks.length < 36) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const payload = line.trim().replace(/^data:\s*/, "");
        if (!payload.startsWith("{")) continue;
        let row: EventRow;
        try {
          row = JSON.parse(payload) as EventRow;
        } catch {
          continue;
        }
        if (typeof row.s_la !== "number" || typeof row.s_lo !== "number") continue;
        if (typeof row.d_la !== "number" || typeof row.d_lo !== "number") continue;
        attacks.push({
          id: `${row.s_co ?? "src"}-${row.d_co ?? "dst"}-${attacks.length}-${row.a_n ?? "attack"}`,
          from: [row.s_la, row.s_lo],
          to: [row.d_la, row.d_lo],
          source: row.s_co || "?",
          destination: row.d_co || "?",
          type: row.a_t || "attack",
          weight: row.a_n || "Attack",
        });
      }
    }
    await reader.cancel().catch(() => undefined);
  } catch {
    return attacks;
  } finally {
    clearTimeout(timer);
  }
  return attacks;
}
