/**
 * Coarse geo for a lookup placard. ipwho.is is HTTPS and returns a
 * country and city, which is enough. Failure becomes "unknown".
 */

import { allowFetch } from "../http";

export async function geoLabel(ip: string): Promise<string> {
  try {
    const response = await allowFetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
    if (!response.ok) return "Location unknown";
    const data = (await response.json()) as { success?: boolean; city?: string; country?: string; country_code?: string };
    if (data.success === false) return "Location unknown";
    return [data.city, data.country || data.country_code].filter(Boolean).join(", ") || "Location unknown";
  } catch {
    return "Location unknown";
  }
}
