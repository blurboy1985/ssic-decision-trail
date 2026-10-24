# SSIC 2025 Decision Trail

Describe a business (or paste a MyCareersFuture job link to load the employer) and watch TypeSafe
**Jev** walk the Singapore Standard Industrial Classification 2025 tree, level by level, to a
5-digit industry code — animated as a pixel-art crowd on a 2D canvas, with every probability listed.

Live: **https://ssic.danielquek.com** · Sister app: [SSOC 2024 Decision Trail](https://github.com/blurboy1985/ssoc-decision-trail)

## Run

```bash
npm install
npm start          # http://localhost:5173 — needs TYPESAFE_API_KEY in the environment
```

Optional env: `PORT`, `TYPESAFE_MODEL` (default `jev-latest`).

## Deploy to Cloudflare (production: https://ssic.danielquek.com)

```bash
npm run deploy
```

`worker/index.mjs` serves the same API as `server.mjs` from a Worker; `public/` is static assets.
Set the TypeSafe key once as a Worker secret: `npx wrangler secret put TYPESAFE_API_KEY`.

Spend protection (in `wrangler.jsonc`): `/api/classify` is limited to 5 runs/min per IP and a
global `DAILY_LIMIT` of 300 runs/day (KV counter `USAGE`, ~23k input tokens per run);
`/api/mcf` to 30 requests/min per IP. Local test: `CLOUDFLARE_INCLUDE_PROCESS_ENV=true npm run dev:cf`.

## How the decision is made (`lib/classify.mjs`)

1. **Read** — a Noul asks whether the text describes what a business does (asked alongside level 1).
2. **Levels 1–5** — Section (A–V) → Division → Group → Class → Sub-class. Beam search (width 3):
   each level is **one** Jev request holding one `Choice` per path still in the beam; options are
   the node's direct children, described with SingStat definitions, the sub-class titles they
   contain, alternative titles from the alphabetical index, and "see …" exclusions. Paths are
   ranked by geometric-mean edge probability (TypeSafe hierarchical-classification cookbook).
3. **Finals** — the 5 best sub-classes meet in one `Choice` with full definitions, covered
   activities and exclusions. Its distribution is the final probability list.

Six requests in total, ~1.4 s. The server streams each step as NDJSON so the canvas animates live.

## Reading the canvas

- **Trail** (top): READ → SECTION → DIVISION → GROUP → CLASS → SUB-CLASS → FINALS. Click a stop or use ←/→.
- **Crowd**: every option Jev weighed, sorted by tier — pink *leading*, orange *kept in beam*,
  gold *considered then pruned*, grey *little chance*. Each of the 82 divisions has its own costume
  (chef for food service, hard hat for construction, lab coat for R&D…). Hover for details.
- **Top paths**: segmented bars show path probability; bubbles show the chain
  (`vote at this level × probability so far`).
- **Finals**: podium heights = final probabilities; result card compares with the employer's
  own SSIC tag on MyCareersFuture.
- **Decision log** below the canvas lists every question and probability as tables.

## Files

| Path | What |
| --- | --- |
| `server.mjs` | HTTP server, `/api/classify` (stream), `/api/mcf` (load employer from a posting) |
| `worker/index.mjs` | Cloudflare Worker with the same API plus rate limits and a daily cap |
| `lib/classify.mjs` | Beam search + finals using `@typesafe-ai/sdk` |
| `lib/mcf.mjs` | MyCareersFuture client: employer profile + SSIC tag |
| `public/` | Canvas app (`app.js`), procedural pixel sprites (`sprites.js`), division costumes (`costumes.js`), sample companies (`samples.json`) |
| `data/ssic2025.json` | Built from SingStat xlsx in `raw/` by `npm run build:data` |
| `tools/snapshot_samples.mjs` | Refreshes `public/samples.json` from `samples/mcf_samples.txt` |
| `tools/eval.mjs` | Runs the sample companies, compares with employer tags |
| `tools/check_costumes.mjs` | Every division has a distinct, valid costume |
| `TEST_RESULTS.md` | Latest evaluation |

Data: SingStat [SSIC 2025](https://www.singstat.gov.sg/standard-classifications/national-classifications/singapore-standard-industrial-classification-ssic)
detailed definitions, alphabetical index and SSIC 2020↔2025 correspondence tables.
