/**
 * Shared shapes for a first-look case.
 * A "vote" is a source that said malicious or not.
 * A null vote means the source answered but did not take a side.
 */

export type IndicatorType = "ip" | "domain" | "url" | "hash" | "cve";

export type SourceState = "hit" | "clean" | "error" | "skipped" | "sample";

export type SourceHit = {
  source: string;
  state: SourceState;
  /** True, false, or null when the source has no verdict. */
  malicious: boolean | null;
  summary: string;
  link?: string;
};

export type ScoreBreakdown = {
  source: string;
  weight: number;
  vote: "malicious" | "clean" | "none";
  note: string;
};

export type ScoreResult = {
  score: number;
  confidence: number;
  disagreements: string[];
  breakdown: ScoreBreakdown[];
};

export type CveRow = {
  id: string;
  description: string;
  cvss: number | null;
  severity: string;
  vector: string;
  kev: boolean;
  epss: number | null;
  patchUrl: string | null;
  patchLabel: string;
  references: { url: string; label: string }[];
  sample?: boolean;
};

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind: "c2" | "victim";
  href?: string;
};

export type FeedItem = {
  indicator: string;
  type: string;
  source: string;
  detail: string;
  href: string;
};

export type AttackItem = {
  name: string;
  href: string;
  detail: string;
};

export type Headline = {
  title: string;
  href: string;
  source: string;
  when: string;
};

export type Brief = {
  available: boolean;
  lines: string[];
  note: string;
};

export type LookupResult = {
  indicator: string;
  type: IndicatorType;
  hits: SourceHit[];
  score: ScoreResult;
  geo: string;
  malware: string[];
  techniques: { id: string; name: string; description: string }[];
  cves: CveRow[];
  brief: Brief;
  sample: boolean;
  pinsEnabled: boolean;
};
