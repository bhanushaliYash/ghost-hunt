import type { SourceHit } from "../types";

export function skipped(source: string, summary: string): SourceHit {
  return { source, state: "skipped", malicious: null, summary };
}

export function failed(source: string): SourceHit {
  return { source, state: "error", malicious: null, summary: "This source did not answer." };
}
