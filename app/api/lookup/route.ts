/**
 * Lookup route used by the site and the extension.
 * The handler checks the indicator, then hands off to lib/lookup.ts.
 */

import { json, rejected } from "@/lib/api";
import { lookupIndicator } from "@/lib/lookup";
import { corsHeaders } from "@/lib/security";
import { InputError } from "@/lib/security";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request) {
  const block = rejected(request, true);
  if (block) return block;
  const q = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const result = await lookupIndicator(q);
    return json(request, result);
  } catch (error) {
    const message = error instanceof InputError ? error.message : "Lookup failed.";
    const status = error instanceof InputError ? 400 : 500;
    return json(request, { error: message }, status);
  }
}
