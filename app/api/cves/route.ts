import { json, rejected } from "@/lib/api";
import { rankCve, recentCves } from "@/lib/cve";
import { cveQuerySchema } from "@/lib/security";

export async function GET(request: Request) {
  const block = rejected(request);
  if (block) return block;
  const params = new URL(request.url).searchParams;
  const parsed = cveQuerySchema.safeParse({
    q: params.get("q") ?? "",
    severity: params.get("severity") ?? "",
    kev: params.get("kev") ?? "0",
  });
  if (!parsed.success) return json(request, { error: "Bad CVE filter." }, 400);
  const { rows, sample } = await recentCves();
  const q = parsed.data.q.toLowerCase();
  const filtered = rows.filter((row) => {
    if (parsed.data.severity && row.severity !== parsed.data.severity) return false;
    if (parsed.data.kev === "1" && !row.kev) return false;
    if (!q) return true;
    return row.id.toLowerCase().includes(q) || row.description.toLowerCase().includes(q);
  });
  filtered.sort((a, b) => rankCve(b) - rankCve(a));
  return json(request, { rows: filtered, sample });
}
