import { json, rejected } from "@/lib/api";
import { addPin, listPins, pinsEnabled } from "@/lib/db";
import { pinSchema } from "@/lib/security";

export async function GET(request: Request) {
  const block = rejected(request);
  if (block) return block;
  if (!pinsEnabled()) return json(request, { enabled: false, pins: [] });
  try {
    const pins = await listPins();
    return json(request, { enabled: true, pins });
  } catch {
    return json(request, { enabled: true, pins: [], error: "Neon did not answer." });
  }
}

export async function POST(request: Request) {
  const block = rejected(request);
  if (block) return block;
  if (!pinsEnabled()) return json(request, { error: "Pins are off. Set DATABASE_URL." }, 400);
  const body = await request.json().catch(() => null);
  const parsed = pinSchema.safeParse(body);
  if (!parsed.success) return json(request, { error: "Pin needs an indicator, a score, and a short note." }, 400);
  try {
    await addPin(parsed.data.indicator, parsed.data.score, parsed.data.note);
    return json(request, { ok: true });
  } catch {
    return json(request, { error: "Neon did not accept the pin." }, 502);
  }
}
