import { json, rejected } from "@/lib/api";
import { allHeadlines } from "@/lib/intel";
import { searchMitre } from "@/lib/mitre";
import { huntSchema } from "@/lib/security";

export async function GET(request: Request) {
  const block = rejected(request);
  if (block) return block;
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const parsed = huntSchema.safeParse(q);
  if (!parsed.success) return json(request, { error: "Enter a short search." }, 400);
  const mitre = searchMitre(parsed.data);
  const headlines = (await allHeadlines().catch(() => [])).filter((item) =>
    item.title.toLowerCase().includes(parsed.data.toLowerCase()),
  );
  return json(request, { mitre, headlines: headlines.slice(0, 6) });
}
