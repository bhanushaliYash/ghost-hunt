/**
 * Hash handoff. MalwareBazaar is the free lookup.
 * ANY.RUN's API is not on the free plan. When a key is absent, or the
 * API refuses, the page still shows the hash and a link to their site.
 */

import { json, rejected } from "@/lib/api";
import { allowFetch } from "@/lib/http";
import { classifyIndicator, InputError } from "@/lib/security";
import { malwarebazaarLookup } from "@/lib/sources/malwarebazaar";

export async function GET(request: Request) {
  const block = rejected(request);
  if (block) return block;
  const hash = new URL(request.url).searchParams.get("hash") ?? "";
  try {
    const indicator = classifyIndicator(hash);
    if (indicator.type !== "hash") throw new InputError("Sandbox lookup takes a file hash.");
    const bazaar = await malwarebazaarLookup(indicator.value);
    const key = process.env.ANYRUN_API_KEY;
    let anyrun = "ANY.RUN API is not on the free plan. Use the link to open their site and paste the hash.";
    if (key) {
      const response = await allowFetch("https://api.any.run/v1/analysis", {
        headers: { authorization: `API-KEY ${key}` },
      }).catch(() => null);
      anyrun = response?.ok
        ? "ANY.RUN accepted the key. Open their console for the interactive session."
        : `ANY.RUN API did not accept this request (${response?.status ?? "no answer"}). The free plan has no API.`;
    }
    return json(request, {
      hash: indicator.value,
      bazaar: bazaar.hit,
      anyrun,
      anyrunUrl: "https://app.any.run/",
    });
  } catch (error) {
    const message = error instanceof InputError ? error.message : "Sandbox lookup failed.";
    return json(request, { error: message }, error instanceof InputError ? 400 : 500);
  }
}
