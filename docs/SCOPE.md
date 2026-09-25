# Scope checklist

Checked against the Ghost Hunt plan on 25 Sep 2026. "Done" means the code is in the repo and `npx tsc --noEmit` passed. It does not mean every live API was called.

| Keypoint | Where | Status |
| --- | --- | --- |
| Problem sentence and user on the home page | `app/page.tsx` | done |
| Threat map (Leaflet, OpenStreetMap, Feodo and victims) | `components/ThreatMap.tsx`, `lib/home.ts` | done |
| IOC feed under the map | `app/page.tsx`, `lib/sources/feodo.ts` | done |
| Named attacks with links | `lib/sources/ransomware.ts` | done |
| Patch-first CVE strip: CVSS, KEV, EPSS, patch link | `lib/cve.ts`, `app/page.tsx` | done |
| CVE page with search, severity, KEV filter | `app/cves/page.tsx`, `app/api/cves/route.ts` | done |
| Lookup: score, confidence, disagreements, case card | `lib/lookup.ts`, `lib/score.ts`, `app/lookup/page.tsx` | done |
| MITRE links only for known technique IDs | `components/MitreText.tsx`, `lib/mitre.ts` | done |
| Hunt search over ATT&CK and headlines | `app/hunt/page.tsx`, `app/api/hunt/route.ts` | done |
| Passive C2, no host probing | `app/c2/page.tsx`, `lib/c2match.ts` | done |
| Signature catalog and honest Shodan search refusal | `data/c2-signatures.json`, `lib/sources/shodan.ts` | done |
| Mail header analysis | `lib/mta.ts`, `app/mail/page.tsx` | done |
| Intel homepages and latest-item pages | `lib/intel.ts`, `app/intel/page.tsx`, `app/intel/[source]/page.tsx` | done |
| Snyk package test and GitHub advisories | `lib/sources/snyk.ts`, `lib/sources/github.ts`, `app/vulns/page.tsx` | done |
| MalwareBazaar plus ANY.RUN handoff, API not faked | `app/sandbox/page.tsx`, `app/api/sandbox/route.ts` | done |
| Lab reads Elasticsearch only | `lib/elastic.ts`, `app/lab/page.tsx` | done |
| Neon pins only, hidden without DATABASE_URL | `lib/db.ts`, `app/api/pins/route.ts` | done |
| Hover rail, accent and density in the browser | `components/NavRail.tsx`, `app/globals.css` | done |
| Buttons, fields, selects, cards, lists, tables, breadcrumbs | `components/ui/` | done |
| Extension: score, confirm before scan, options origin | `extension/` | done |
| Sample fixtures | `data/samples/`, `lib/samples.ts` | done |
| Gemini disposition, labeled fallback | `lib/brief.ts` | done |
| Threat model | `README.md`, `lib/security.ts` | done |
| Tools and prompts | `docs/WORKFLOW.md` | done |
| Env template, no secrets | `.env.example`, `.gitignore` | done |
| Elasticsearch bound to 127.0.0.1 | `docker-compose.yml` | done |
| No SSRF, zod checks, security headers, rate limit | `lib/security.ts`, `lib/http.ts`, `next.config.ts` | done |

Not in scope, and not built: Cloud SQL, AlloyDB, Firebase, Supabase, a chat page, a hamburger menu, an active internet scanner.

MITRE data shipped in the repo is a seed index in `data/mitre.json`. `scripts/build-mitre.mjs` can replace it with the full Enterprise bundle when GitHub is reachable. That script has not been run in this check.
