/**
 * Threat model, in plain language.
 *
 * Ghost Hunt is a read-only proxy for an analyst on shift.
 * It accepts an indicator (IP, domain, URL, hash, CVE, package name, or
 * email header text) and sends that string only to a fixed list of public
 * intel APIs. It never requests the URL the analyst pasted, so a lookup
 * cannot be turned into a scan of an internal host.
 *
 * Secrets stay in server environment variables. The browser and the
 * extension receive scores and summaries, not API keys.
 * Inputs are checked with zod before any outbound call. Responses from
 * feeds are rendered as text. A small in-memory rate limit keeps one demo
 * tab from hammering upstream APIs.
 * Elasticsearch is allowed only on localhost or a known Elastic Cloud host.
 * Neon stores pinned cases only, and only when DATABASE_URL is set.
 * No customer data is accepted or stored.
 */

import { z } from "zod";
import type { IndicatorType } from "./types";

const WINDOW_MS = 60_000;
const MAX_HITS = 30;
const buckets = new Map<string, number[]>();

const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
const ipv6 = /^[0-9a-f:]+$/i;
const domain = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const md5 = /^[a-f0-9]{32}$/i;
const sha1 = /^[a-f0-9]{40}$/i;
const sha256 = /^[a-f0-9]{64}$/i;
const cveId = /^CVE-\d{4}-\d{4,}$/i;

export const ALLOWED_HOSTS = new Set([
  "feodotracker.abuse.ch",
  "urlhaus-api.abuse.ch",
  "threatfox-api.abuse.ch",
  "mb-api.abuse.ch",
  "api.ransomware.live",
  "www.ransomware.live",
  "services.nvd.nist.gov",
  "www.cisa.gov",
  "api.first.org",
  "api.github.com",
  "krebsonsecurity.com",
  "www.bleepingcomputer.com",
  "feeds.feedburner.com",
  "thehackernews.com",
  "www.darkreading.com",
  "isc.sans.edu",
  "www.schneier.com",
  "otx.alienvault.com",
  "api.abuseipdb.com",
  "www.virustotal.com",
  "api.greynoise.io",
  "api.shodan.io",
  "api.platform.censys.io",
  "api.snyk.io",
  "snyk.io",
  "api.any.run",
  "generativelanguage.googleapis.com",
  "ipwho.is",
]);

export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

/** Reject anything that is not a single indicator we know how to classify. */
export function classifyIndicator(raw: string): { type: IndicatorType; value: string } {
  const value = raw.trim();
  if (!value || value.length > 2048) {
    throw new InputError("Enter one indicator, up to 2048 characters.");
  }
  if (cveId.test(value)) return { type: "cve", value: value.toUpperCase() };
  if (ipv4.test(value) || (value.includes(":") && ipv6.test(value) && value.length <= 45)) {
    return { type: "ip", value };
  }
  if (md5.test(value) || sha1.test(value) || sha256.test(value)) {
    return { type: "hash", value: value.toLowerCase() };
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new InputError("That URL could not be parsed.");
    }
    if (url.username || url.password) throw new InputError("URLs with credentials are rejected.");
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new InputError("Only http and https URLs are accepted.");
    }
    return { type: "url", value: url.toString() };
  }
  const host = value.replace(/\.$/, "").toLowerCase();
  if (domain.test(host)) return { type: "domain", value: host };
  throw new InputError("Use an IP, domain, http(s) URL, file hash, or CVE ID.");
}

export const cveQuerySchema = z.object({
  q: z.string().trim().max(80).optional().default(""),
  severity: z.enum(["", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().default(""),
  kev: z.enum(["0", "1"]).optional().default("0"),
});

export const packageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(214)
    .regex(/^[a-z0-9][a-z0-9._-]*$/i, "Package name looks wrong."),
  version: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .regex(/^[0-9A-Za-z.+-]+$/, "Version looks wrong."),
});

export const headerSchema = z.string().trim().min(1).max(20_000);
export const noteSchema = z.string().trim().max(280);
export const huntSchema = z.string().trim().min(1).max(80);
export const pinSchema = z.object({
  indicator: z.string().trim().min(1).max(2048),
  score: z.number().int().min(0).max(100),
  note: noteSchema,
});

export function assertAllowed(url: string): URL {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Blocked protocol.");
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new Error(`Host not allowlisted: ${parsed.hostname}`);
  }
  return parsed;
}

/** Elastic may only be the local lab or an Elastic Cloud host from env. */
export function assertElasticUrl(url: string): URL {
  const parsed = new URL(url);
  const host = parsed.hostname;
  const cloud = host.endsWith(".elastic-cloud.com") || host.endsWith(".cloud.es.io") || host.endsWith(".found.io");
  const local = host === "127.0.0.1" || host === "localhost";
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Blocked Elasticsearch protocol.");
  }
  if (!local && !cloud) throw new Error("Elasticsearch host is not local or Elastic Cloud.");
  return parsed;
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "local";
}

/** Fixed window. Enough for a live demo, small enough to refuse a loop. */
export function rateLimit(request: Request): boolean {
  const key = clientKey(request);
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_HITS) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/**
 * Browser calls must come from this site.
 * The extension origin is chrome-extension:// and is allowed only on lookup,
 * because the popup cannot share the site origin.
 */
export function originAllowed(request: Request, allowExtension: boolean): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const app = process.env.APP_ORIGIN || "http://localhost:3000";
  if (origin === app) return true;
  if (allowExtension && origin.startsWith("chrome-extension://")) return true;
  return false;
}

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  if (!origin || !originAllowed(request, true)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
