# How Ghost Hunt was built

The working prototype was implemented in Cursor from a written plan. Planning was not the submission. The site, the extension, and this note are.

## Tools

- Cursor, with the coding agent writing the Next.js app, the Chrome extension, and these docs.
- Next.js on the local machine for the prototype. Vercel is the intended host because the lookup routes have to keep API keys off the browser.
- Public feeds: Feodo Tracker, ransomware.live, NVD, CISA KEV, FIRST EPSS, GitHub Security Advisories, and the RSS feeds listed in `lib/intel.ts`.
- Optional free API keys, documented in `.env.example`. None are committed.
- Sample and synthetic records in `data/samples/` so a live demo still finishes when a feed does not answer.

## Prompts that shaped the product

The build prompt was the Ghost Hunt plan: one analyst, one case card, passive C2 checks, a patch-first CVE strip, a hover rail, and a security model that refuses to fetch pasted URLs.

The in-product prompt is the disposition. It is the same text as `DISPOSITION_PROMPT` in `lib/brief.ts`:

```
You write a four-line disposition for a threat analyst.
Use only the JSON evidence below. Do not add sources, CVE IDs, technique IDs, or patch links that are not in the JSON.
If a field is empty, say it is unknown.
Return exactly four lines, no markdown, in this order:
What: ...
Score: ...
Next: ...
Uncertain: ...
```

The model receives structured evidence that is already on the card, not a raw web page and not the analyst's URL to fetch. That is deliberate. A prompt that pastes arbitrary pages would be harder to check and would invite the model to invent indicators.

If `GEMINI_API_KEY` is missing or the call fails, the interface says the model is unavailable. It does not fill in a fake paragraph.

## What was kept, and what was tightened by hand

Kept from the plan: the case card, the score that lists disagreements, CVSS plus KEV plus EPSS, the rail, Neon for pins only, Elasticsearch for the lab only.

Tightened while writing the code:

- The server allowlist and the manual redirect check were written as code, not left as a comment.
- A second JARM that could not be tied to a specific public fingerprint was not shipped. The catalog keeps one published Cobalt Strike JARM, plus certificate and header leads that say they are leads.
- Cloud SQL, AlloyDB, Firebase, and Supabase were not added. They would store the same pins again.
- The extension does not receive a host permission for every site. Scan this page waits for Confirm scan.

## What does not work on purpose

- Shodan-wide C2 search on a free key. The C2 page shows the refusal and still lists Feodo.
- ANY.RUN API on the free plan. The sandbox page uses MalwareBazaar when a key exists and always offers the ANY.RUN website.
- Elasticsearch on Vercel. The lab is local Docker.
