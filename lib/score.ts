/**
 * Explainable score for an analyst, not a black-box reputation number.
 *
 * Only sources that cast a yes/no vote move the score. The score is a
 * weighted average, so it stays inside 0–100. Confidence drops when few
 * sources voted or when they disagree. A single vote cannot look certain.
 *
 * Weights are relative: a current C2 listing outweighs one pulse.
 */

import type { ScoreBreakdown, ScoreResult, SourceHit } from "./types";

const WEIGHTS: Record<string, number> = {
  "Feodo Tracker": 5,
  ThreatFox: 4,
  URLhaus: 4,
  MalwareBazaar: 5,
  AbuseIPDB: 3,
  "AlienVault OTX": 3,
  VirusTotal: 4,
  GreyNoise: 3,
  Shodan: 2,
  Censys: 2,
  "Signature match": 3,
};

function weightOf(source: string): number {
  return WEIGHTS[source] ?? 2;
}

export function scoreHits(hits: SourceHit[]): ScoreResult {
  const votes = hits.filter((hit) => hit.malicious !== null && hit.state !== "error" && hit.state !== "skipped");
  const breakdown: ScoreBreakdown[] = hits.map((hit) => ({
    source: hit.source,
    weight: weightOf(hit.source),
    vote: (hit.malicious === true ? "malicious" : hit.malicious === false ? "clean" : "none") as ScoreBreakdown["vote"],
    note: hit.summary,
  }));

  if (votes.length === 0) {
    return { score: 0, confidence: 20, disagreements: [], breakdown };
  }

  let weighted = 0;
  let total = 0;
  for (const vote of votes) {
    const weight = weightOf(vote.source);
    weighted += (vote.malicious ? 100 : 0) * weight;
    total += weight;
  }
  const score = Math.round(weighted / total);
  const malicious = votes.filter((vote) => vote.malicious);
  const clean = votes.filter((vote) => !vote.malicious);
  const disagreements: string[] = [];
  if (malicious.length && clean.length) {
    disagreements.push(
      `${malicious.map((vote) => vote.source).join(", ")} say malicious; ${clean.map((vote) => vote.source).join(", ")} say clean.`,
    );
  }
  const agreement = 1 - Math.min(malicious.length, clean.length) / votes.length;
  const configured = hits.filter((hit) => hit.state !== "skipped").length || 1;
  let confidence = Math.round(agreement * (votes.length / configured) * 100);
  if (votes.length < 2) confidence = Math.min(confidence, 45);
  if (disagreements.length) confidence = Math.min(confidence, 70);
  return { score, confidence: Math.max(0, Math.min(100, confidence)), disagreements, breakdown };
}
