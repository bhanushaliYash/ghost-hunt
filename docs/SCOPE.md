# Scope checklist

Cross-checked against the Ghost Hunt plan on 25 Sep 2026. Status rules:

- **done** — file opened or route run in this session; behavior matches the plan keypoint.
- **partial** — present but missing a planned detail (called out in Notes).
- **not done** — not found in the repo.

Build verification this session: `npx tsc --noEmit` (exit 0), `npx next build` (exit 0), `npm audit` (0 vulnerabilities).

| Keypoint | Where | Status | Notes |
| --- | --- | --- | --- |
| Problem sentence and user on the home page | `app/page.tsx` | done | Lede plus “For the analyst on shift.” |
| Threat map | `components/ThreatMap.tsx`, `app/api/threatmap/route.ts`, `lib/sources/checkpoint.ts` | done | Live Check Point arcs; home board still lists Feodo points in `lib/home.ts`. |
| IOC feed under the map | `app/page.tsx`, `lib/home.ts`, `lib/sources/feodo.ts` | done | |
| Named attacks with links | `lib/sources/ransomware.ts`, `app/page.tsx` | done | |
| Patch-first CVE strip (CVSS, KEV, EPSS, patch link) | `lib/cve.ts`, `app/page.tsx` | done | |
| CVE page with search and filters | `app/cves/page.tsx`, `app/api/cves/route.ts` | done | Search, severity, KEV filter. |
| Lookup: score, confidence, disagreements, case card | `lib/lookup.ts`, `lib/score.ts`, `app/lookup/page.tsx` | done | |
| MITRE links for known technique IDs | `components/MitreText.tsx`, `lib/mitre.ts` | done | |
| Hunt search | `app/hunt/page.tsx`, `app/api/hunt/route.ts` | done | |
| Passive C2 (no host probing) | `app/c2/page.tsx`, `lib/c2match.ts`, `app/api/c2/route.ts` | done | Signature compare only; host data from Shodan/Censys APIs. |
| Signature catalog and honest Shodan search limit | `data/c2-signatures.json`, `lib/sources/shodan.ts` | done | 403/401 surfaced as refusal text. |
| Mail header analysis | `lib/mta.ts`, `app/mail/page.tsx`, `app/api/mail/route.ts` | done | |
| Intel sources (homepage and latest item) | `lib/intel.ts`, `app/intel/page.tsx`, `app/intel/[source]/page.tsx` | done | |
| Snyk plus GitHub advisories | `lib/sources/snyk.ts`, `lib/sources/github.ts`, `app/vulns/page.tsx` | done | |
| MalwareBazaar plus ANY.RUN handoff (API not faked) | `app/sandbox/page.tsx`, `app/api/sandbox/route.ts` | done | |
| Lab uses Elasticsearch only | `lib/elastic.ts`, `app/lab/page.tsx` | done | Not Neon. |
| Neon pins only; hidden without `DATABASE_URL` | `lib/db.ts`, `app/api/pins/route.ts`, `app/lookup/page.tsx` | done | |
| Hover nav rail with accent and density | `components/NavRail.tsx`, `app/globals.css` | done | Presets at bottom of rail; persisted in `localStorage`. |
| Shared buttons, fields, selects, cards, lists, tables, breadcrumbs | `components/ui/` | done | |
| Chrome extension with confirm-before-scan | `extension/` | done | `popup.js` shows confirm box before tab URL lookup. |
| Sample fixtures | `data/samples/`, `lib/samples.ts` | done | |
| Gemini disposition with labeled fallback | `lib/brief.ts` | done | |
| Threat model | `README.md`, `lib/security.ts` | done | |
| `docs/WORKFLOW.md` | `docs/WORKFLOW.md` | done | |
| `.env.example` | `.env.example` | done | |
| `docker-compose` bound to 127.0.0.1 | `docker-compose.yml` | done | |
| Security (no SSRF, zod, headers, rate limit, server-side secrets) | `lib/security.ts`, `lib/http.ts`, `next.config.ts` | done | |

**Counts:** 27 done · 0 partial · 0 not done

Not in scope and not built: Cloud SQL, AlloyDB, Firebase, Supabase, a chat page, a hamburger menu, active internet scanning.

MITRE seed data lives in `data/mitre.json`. `scripts/build-mitre.mjs` can refresh it from GitHub when reachable; that script was not run in this check.
