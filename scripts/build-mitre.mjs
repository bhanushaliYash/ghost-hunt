/**
 * Optional. Replaces data/mitre.json with a slim Enterprise ATT&CK index
 * from the public mitre/cti repository. The committed seed is enough
 * for the demo if this download fails.
 */

import { writeFile } from "node:fs/promises";

const url = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";
const response = await fetch(url);
if (!response.ok) {
  console.error("MITRE download failed", response.status);
  process.exit(1);
}
const bundle = await response.json();
const objects = bundle.objects ?? [];

function externalId(object, prefix) {
  const ref = (object.external_references ?? []).find((item) => String(item.external_id || "").startsWith(prefix));
  return ref?.external_id ?? "";
}

const techniques = [];
const groups = [];
const software = [];

for (const object of objects) {
  if (object.revoked || object.x_mitre_deprecated) continue;
  const description = String(object.description || "").replace(/\s+/g, " ").slice(0, 220);
  if (object.type === "attack-pattern") {
    const id = externalId(object, "T");
    if (!id) continue;
    techniques.push({
      id,
      name: object.name,
      description,
      tactics: (object.kill_chain_phases ?? []).map((phase) => phase.phase_name),
    });
  } else if (object.type === "intrusion-set") {
    const id = externalId(object, "G");
    if (!id) continue;
    groups.push({ id, name: object.name, description, techniques: [] });
  } else if (object.type === "malware" || object.type === "tool") {
    const id = externalId(object, "S");
    if (!id) continue;
    software.push({ id, name: object.name, description, techniques: [] });
  }
}

const bySource = new Map(objects.map((object) => [object.id, object]));
for (const object of objects) {
  if (object.type !== "relationship" || object.relationship_type !== "uses") continue;
  const source = bySource.get(object.source_ref);
  const target = bySource.get(object.target_ref);
  if (!source || !target || target.type !== "attack-pattern") continue;
  const techniqueId = externalId(target, "T");
  const holder =
    source.type === "intrusion-set"
      ? groups.find((item) => item.id === externalId(source, "G"))
      : software.find((item) => item.id === externalId(source, "S"));
  if (holder && techniqueId && !holder.techniques.includes(techniqueId) && holder.techniques.length < 8) {
    holder.techniques.push(techniqueId);
  }
}

await writeFile(
  new URL("../data/mitre.json", import.meta.url),
  JSON.stringify({ techniques, groups, software }, null, 2),
);
console.log(`techniques ${techniques.length}, groups ${groups.length}, software ${software.length}`);
