/**
 * Passive C2 page data. Search runs only when the analyst asks, and
 * only as one Shodan query. A refusal from Shodan is the result.
 */

import { json, rejected } from "@/lib/api";
import { matchBanners, signatureCatalog } from "@/lib/c2match";
import { classifyIndicator, InputError } from "@/lib/security";
import { censysHost } from "@/lib/sources/censys";
import { feodoRows } from "@/lib/sources/feodo";
import { shodanHost, shodanSearch } from "@/lib/sources/shodan";

export async function GET(request: Request) {
  const block = rejected(request);
  if (block) return block;
  const params = new URL(request.url).searchParams;
  const feodo = await feodoRows();
  const catalog = signatureCatalog();
  let host = null;
  let search = null;
  const q = params.get("q");
  if (q) {
    try {
      const indicator = classifyIndicator(q);
      if (indicator.type !== "ip") throw new InputError("C2 host check takes an IP.");
      const [shodan, censys] = await Promise.all([shodanHost(indicator.value), censysHost(indicator.value)]);
      host = { shodan: shodan.hit, censys: censys.hit, match: matchBanners([shodan.banner, censys.banner]) };
    } catch (error) {
      const message = error instanceof InputError ? error.message : "Host check failed.";
      return json(request, { error: message }, 400);
    }
  }
  if (params.get("search") === "1") {
    const jarm = catalog.find((item) => item.jarm[0])?.jarm[0];
    search = jarm
      ? await shodanSearch(`ssl.jarm:${jarm}`)
      : { ok: false, message: "No JARM in the catalog.", matches: [] };
  }
  return json(request, {
    sample: feodo.sample,
    rows: feodo.rows.slice(0, 25),
    catalog,
    host,
    search,
  });
}
