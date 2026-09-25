import { json, rejected } from "@/lib/api";
import { parseHeaders } from "@/lib/mta";
import { headerSchema } from "@/lib/security";

export async function POST(request: Request) {
  const block = rejected(request);
  if (block) return block;
  const body = (await request.json().catch(() => null)) as { header?: string } | null;
  const parsed = headerSchema.safeParse(body?.header ?? "");
  if (!parsed.success) return json(request, { error: "Paste a header block under 20,000 characters." }, 400);
  return json(request, parseHeaders(parsed.data));
}
