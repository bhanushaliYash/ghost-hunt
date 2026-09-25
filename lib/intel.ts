/**
 * Public security writing, one list. Each source has a homepage and a feed.
 * Item text is stored as text. We never render feed HTML.
 */

import { cached } from "./cache";
import { allowFetch } from "./http";
import type { Headline } from "./types";

export type IntelSource = {
  id: string;
  name: string;
  home: string;
  feed: string;
};

export const INTEL_SOURCES: IntelSource[] = [
  { id: "krebs", name: "Krebs on Security", home: "https://krebsonsecurity.com/", feed: "https://krebsonsecurity.com/feed/" },
  { id: "bleeping", name: "BleepingComputer", home: "https://www.bleepingcomputer.com/", feed: "https://www.bleepingcomputer.com/feed/" },
  { id: "thn", name: "The Hacker News", home: "https://thehackernews.com/", feed: "https://feeds.feedburner.com/TheHackersNews" },
  { id: "darkreading", name: "Dark Reading", home: "https://www.darkreading.com/", feed: "https://www.darkreading.com/rss.xml" },
  { id: "sans", name: "SANS Internet Storm Center", home: "https://isc.sans.edu/", feed: "https://isc.sans.edu/rssfeed.xml" },
  { id: "schneier", name: "Schneier on Security", home: "https://www.schneier.com/", feed: "https://www.schneier.com/feed/atom/" },
  { id: "cisa", name: "CISA advisories", home: "https://www.cisa.gov/news-events/cybersecurity-advisories", feed: "https://www.cisa.gov/cybersecurity-advisories/all.xml" },
];

function decode(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/** Small RSS/Atom reader. Enough for titles and links, not a general XML parser. */
export function parseFeed(xml: string, source: string): Headline[] {
  const chunks = xml.split(/<item\b|<entry\b/i).slice(1);
  const headlines: Headline[] = [];
  for (const chunk of chunks) {
    const title = decode(chunk.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const linkTag = chunk.match(/<link[^>]*>/i)?.[0] ?? "";
    const hrefAttr = linkTag.match(/href=["']([^"']+)["']/i)?.[1];
    const linkBody = decode(chunk.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "");
    const href = hrefAttr || linkBody;
    const when = decode(chunk.match(/<(?:pubDate|updated|published)[^>]*>([\s\S]*?)<\/(?:pubDate|updated|published)>/i)?.[1] ?? "");
    if (!title || !href.startsWith("http")) continue;
    headlines.push({ title: title.slice(0, 180), href, source, when: when.slice(0, 40) });
    if (headlines.length >= 8) break;
  }
  return headlines;
}

export async function feedFor(source: IntelSource): Promise<Headline[]> {
  return cached(`feed:${source.id}`, 20 * 60_000, async () => {
    const response = await allowFetch(source.feed);
    if (!response.ok) return [];
    return parseFeed(await response.text(), source.name);
  });
}

export async function allHeadlines(): Promise<Headline[]> {
  const batches = await Promise.all(INTEL_SOURCES.map((source) => feedFor(source).catch(() => [] as Headline[])));
  return batches.flat();
}

export function findSource(id: string): IntelSource | undefined {
  return INTEL_SOURCES.find((source) => source.id === id);
}
