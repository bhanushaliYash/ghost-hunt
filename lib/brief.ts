/**
 * One disposition, after the evidence is already on the card.
 * The model may only restate what we hand it. It does not browse,
 * and it does not get the raw indicator URL to fetch.
 *
 * If GEMINI_API_KEY is missing or the call fails, the card keeps the
 * evidence and says the model is unavailable. We do not invent a paragraph.
 */

import { allowFetch } from "./http";
import type { Brief, LookupResult } from "./types";

export const DISPOSITION_PROMPT = `You write a four-line disposition for a threat analyst.
Use only the JSON evidence below. Do not add sources, CVE IDs, technique IDs, or patch links that are not in the JSON.
If a field is empty, say it is unknown.
Return exactly four lines, no markdown, in this order:
What: ...
Score: ...
Next: ...
Uncertain: ...`;

type Evidence = Pick<LookupResult, "indicator" | "type" | "hits" | "score" | "malware" | "techniques" | "cves">;

export function evidenceForModel(result: Evidence): string {
  return JSON.stringify({
    indicatorType: result.type,
    hits: result.hits.map((hit) => ({ source: hit.source, state: hit.state, malicious: hit.malicious, summary: hit.summary })),
    score: result.score.score,
    confidence: result.score.confidence,
    disagreements: result.score.disagreements,
    malware: result.malware,
    techniques: result.techniques.map((item) => item.id),
    cves: result.cves.map((cve) => ({
      id: cve.id,
      cvss: cve.cvss,
      kev: cve.kev,
      epss: cve.epss,
      patch: Boolean(cve.patchUrl),
    })),
  });
}

export async function writeBrief(result: Evidence): Promise<Brief> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return { available: false, lines: [], note: "Model unavailable. The evidence above is the disposition." };
  }
  try {
    const response = await allowFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${DISPOSITION_PROMPT}\n\n${evidenceForModel(result)}` }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 320 },
        }),
      },
    );
    if (!response.ok) {
      return { available: false, lines: [], note: "Model unavailable. The evidence above is the disposition." };
    }
    const body = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "";
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^(What|Score|Next|Uncertain):/i.test(line))
      .slice(0, 4);
    if (lines.length < 4) {
      return { available: false, lines: [], note: "Model unavailable. The evidence above is the disposition." };
    }
    return { available: true, lines, note: "Written only from the evidence on this card." };
  } catch {
    return { available: false, lines: [], note: "Model unavailable. The evidence above is the disposition." };
  }
}
