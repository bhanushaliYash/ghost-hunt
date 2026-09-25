/**
 * Local MITRE ATT&CK index. Technique links are built only from IDs that
 * exist here, so a random T9999 in a headline does not become a link
 * unless we actually have a description for it.
 * scripts/build-mitre.mjs can replace data/mitre.json with the full
 * Enterprise bundle when GitHub is reachable.
 */

import mitre from "@/data/mitre.json";

export type Technique = { id: string; name: string; description: string; tactics: string[] };
export type Named = { id: string; name: string; description: string; techniques: string[] };

const techniques = mitre.techniques as Technique[];
const groups = mitre.groups as Named[];
const software = mitre.software as Named[];

const byId = new Map(techniques.map((item) => [item.id, item]));

export function technique(id: string): Technique | undefined {
  return byId.get(id.toUpperCase());
}

export function techniqueUrl(id: string): string {
  const clean = id.toUpperCase();
  if (clean.includes(".")) {
    const [parent, sub] = clean.split(".");
    return `https://attack.mitre.org/techniques/${parent}/${sub}/`;
  }
  return `https://attack.mitre.org/techniques/${clean}/`;
}

export function softwareUrl(id: string): string {
  return `https://attack.mitre.org/software/${id}/`;
}

export function groupUrl(id: string): string {
  return `https://attack.mitre.org/groups/${id}/`;
}

/** Map a malware family name from a feed onto local ATT&CK software. */
export function matchMalware(names: string[]): { malware: string[]; techniques: Technique[] } {
  const found: Named[] = [];
  for (const name of names) {
    const needle = name.toLowerCase();
    for (const item of software) {
      if (item.name.toLowerCase() === needle || needle.includes(item.name.toLowerCase())) {
        if (!found.some((row) => row.id === item.id)) found.push(item);
      }
    }
  }
  const tech: Technique[] = [];
  for (const item of found) {
    for (const id of item.techniques) {
      const row = byId.get(id);
      if (row && !tech.some((existing) => existing.id === row.id)) tech.push(row);
    }
  }
  return { malware: found.map((item) => item.name), techniques: tech };
}

export type HuntHit = {
  kind: "technique" | "group" | "software";
  id: string;
  name: string;
  description: string;
  href: string;
};

export function searchMitre(query: string): HuntHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const hits: HuntHit[] = [];
  const take = (kind: HuntHit["kind"], rows: { id: string; name: string; description: string }[], href: (id: string) => string) => {
    for (const row of rows) {
      const blob = `${row.id} ${row.name} ${row.description}`.toLowerCase();
      if (blob.includes(needle)) {
        hits.push({ kind, id: row.id, name: row.name, description: row.description, href: href(row.id) });
      }
    }
  };
  take("technique", techniques, techniqueUrl);
  take("group", groups, groupUrl);
  take("software", software, softwareUrl);
  return hits.slice(0, 12);
}

export function allTechniques(): Technique[] {
  return techniques;
}
