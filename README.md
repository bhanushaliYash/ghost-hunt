# Ghost Hunt

First-look triage for an analyst on shift.

The hash is in one tab. The IP is in another. The phish header is in a text file. The patch is on a vendor page you have not opened yet. Ghost Hunt puts the score, the disagreement, the technique, and the patch on one screen.

The case card puts the score, the sources that disagree, the ATT&CK technique, the CVE, and the patch link in one place. It does not store customer data. Pins are optional and off until `DATABASE_URL` is set.

## Threat model

Ghost Hunt is a read-only proxy.

- The server never requests a URL an analyst pastes. That string is sent only to allowlisted intel APIs. See `lib/security.ts`.
- Inputs are validated before any outbound call. Feed text is rendered as text.
- API keys stay in server environment variables. The browser and the extension do not receive them.
- Lookup is rate-limited. CORS allows this site, plus the extension origin on `/api/lookup`.
- Elasticsearch binds to localhost in `docker-compose.yml` and is refused for any other host except Elastic Cloud.
- Neon, when configured, stores pinned cases only. The Lab page does not read that table.

Run `npm audit` before a demo. The lockfile is part of the submission.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Copy `.env.example` to `.env.local` and fill only the keys you have. Blank keys skip that source. The app still finishes on public feeds and the files in `data/samples/`.

| Key | What it unlocks |
| --- | --- |
| `ABUSECH_AUTH_KEY` | URLhaus, ThreatFox, MalwareBazaar. Free at https://auth.abuse.ch/ |
| `OTX_API_KEY` | AlienVault OTX |
| `ABUSEIPDB_API_KEY` | AbuseIPDB |
| `VIRUSTOTAL_API_KEY` | VirusTotal |
| `GREYNOISE_API_KEY` | GreyNoise community |
| `SHODAN_API_KEY` | Host lookup. Internet-wide search often needs a paid plan |
| `CENSYS_API_TOKEN` | Censys host lookup |
| `NVD_API_KEY` | Higher NVD rate limit. The feed works without it |
| `SNYK_TOKEN` | npm package test |
| `GEMINI_API_KEY` | Four-line disposition. The card still shows evidence without it |
| `ANYRUN_API_KEY` | Optional. The free ANY.RUN plan has no API |
| `DATABASE_URL` | Neon pins |
| `ELASTIC_URL` | Local hunt lab |

## Extension

Load `extension/` as an unpacked extension in Chrome. It asks before it scores the current tab. Options stores the site origin. Localhost is permitted in the manifest. Any other origin needs a Chrome permission prompt.

## Lab

```powershell
$env:ELASTIC_PASSWORD = "a-long-local-password"
docker compose up
```

Set `ELASTIC_URL=http://127.0.0.1:9200` and the same password in `.env.local`. Kibana is on http://127.0.0.1:5601. This does not deploy with the Vercel site.

## Four-minute demo

1. Read the problem sentence on the home page and name the user: the analyst on shift.
2. Show a map point and one row under Patch these first. Open it and show CVSS, KEV or EPSS, and the patch link.
3. Lookup, Use sample IP. Show the score, the sample dissent, the case card, and the disposition. If the model key is empty, the line says the model is unavailable and the evidence stays on screen.
4. Mail, Use sample header. Show the SPF, DKIM, and DMARC failure. Then the extension: Scan this page, confirm, score.
5. Say what did not work. Shodan-wide search and the ANY.RUN API are not on the free tier. C2 still lists Feodo. Sandbox still hands the hash to MalwareBazaar and opens ANY.RUN.
6. Close on security: public indicators only, keys on the server, `npm audit`, threat model in this file.

Backup screens if someone asks: Hunt (Cobalt Strike), Intel (Krebs), Vulns (lodash), Lab after docker compose, accent preset at the bottom of the rail.

## What the free tiers do not do

Shodan internet-wide search usually needs a membership. ANY.RUN's API is not on the free plan. Those are shown in the product as limits, not hidden.
