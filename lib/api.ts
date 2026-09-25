import { corsHeaders, originAllowed, rateLimit } from "./security";

export function rejected(request: Request, allowExtension = false): Response | null {
  if (!originAllowed(request, allowExtension)) {
    return Response.json({ error: "Origin not allowed." }, { status: 403 });
  }
  if (!rateLimit(request)) {
    return Response.json({ error: "Too many requests. Wait a minute." }, { status: 429, headers: corsHeaders(request) });
  }
  return null;
}

export function json(request: Request, body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders(request) });
}
