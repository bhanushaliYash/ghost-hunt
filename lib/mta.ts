/**
 * Mail header triage. The analyst pastes a header block and we read it
 * as text: hop order, From versus Return-Path, and SPF, DKIM, DMARC
 * from Authentication-Results. Nothing in the header is executed or fetched.
 */

export type MailHop = {
  index: number;
  from: string;
  by: string;
  ip: string;
};

export type MailReport = {
  from: string;
  returnPath: string;
  subject: string;
  spf: string;
  dkim: string;
  dmarc: string;
  alignment: string[];
  hops: MailHop[];
  indicators: { value: string; type: "ip" | "domain" }[];
};

function unfold(raw: string): string {
  return raw.replace(/\r\n/g, "\n").replace(/\n[ \t]+/g, " ");
}

function headerMap(text: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (!match) continue;
    const name = match[1].toLowerCase();
    const list = map.get(name) ?? [];
    list.push(match[2].trim());
    map.set(name, list);
  }
  return map;
}

function domainOf(address: string): string {
  const match = address.match(/@([a-z0-9.-]+\.[a-z]{2,})/i);
  return match ? match[1].toLowerCase() : "";
}

function authResult(blob: string, name: string): string {
  const match = blob.match(new RegExp(`\\b${name}\\s*=\\s*([a-z]+)`, "i"));
  return match ? match[1].toLowerCase() : "absent";
}

export function parseHeaders(raw: string): MailReport {
  const text = unfold(raw);
  const headers = headerMap(text);
  const from = headers.get("from")?.[0] ?? "";
  const returnPath = headers.get("return-path")?.[0] ?? "";
  const subject = headers.get("subject")?.[0] ?? "";
  const auth = (headers.get("authentication-results") ?? []).join(" ");
  const received = headers.get("received") ?? [];
  const hops: MailHop[] = received.map((line, index) => {
    const fromHost = line.match(/from\s+(\S+)/i)?.[1]?.replace(/[;()]/g, "") ?? "";
    const by = line.match(/\bby\s+(\S+)/i)?.[1]?.replace(/[;()]/g, "") ?? "";
    const ip = line.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)?.[0] ?? "";
    return { index: index + 1, from: fromHost, by, ip };
  });

  const alignment: string[] = [];
  const fromDomain = domainOf(from);
  const returnDomain = domainOf(returnPath);
  if (fromDomain && returnDomain && fromDomain !== returnDomain) {
    alignment.push(`From domain ${fromDomain} does not match Return-Path domain ${returnDomain}.`);
  }
  const spf = authResult(auth, "spf");
  const dkim = authResult(auth, "dkim");
  const dmarc = authResult(auth, "dmarc");
  if (spf === "fail" || spf === "softfail") alignment.push(`SPF ${spf}.`);
  if (dkim === "fail") alignment.push("DKIM failed.");
  if (dmarc === "fail") alignment.push("DMARC failed.");
  if (!alignment.length) alignment.push("No alignment break found in these headers.");

  const indicators: { value: string; type: "ip" | "domain" }[] = [];
  const seen = new Set<string>();
  for (const hop of hops) {
    if (hop.ip && !seen.has(hop.ip)) {
      seen.add(hop.ip);
      indicators.push({ value: hop.ip, type: "ip" });
    }
  }
  for (const host of [fromDomain, returnDomain]) {
    if (host && !seen.has(host)) {
      seen.add(host);
      indicators.push({ value: host, type: "domain" });
    }
  }

  return { from, returnPath, subject, spf, dkim, dmarc, alignment, hops, indicators };
}
