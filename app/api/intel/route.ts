import { json, rejected } from "@/lib/api";
import { INTEL_SOURCES, feedFor, findSource } from "@/lib/intel";

export async function GET(request: Request) {
  const block = rejected(request);
  if (block) return block;
  const id = new URL(request.url).searchParams.get("source");
  if (!id) {
    return json(
      request,
      INTEL_SOURCES.map((source) => ({ id: source.id, name: source.name, home: source.home })),
    );
  }
  const source = findSource(id);
  if (!source) return json(request, { error: "Unknown source." }, 404);
  const items = await feedFor(source).catch(() => []);
  return json(request, { source: { id: source.id, name: source.name, home: source.home }, items });
}
