# SSIC 2025 Decision Trail — Plan

## Goal
Sister app to [ssoc-decision-trail](https://github.com/blurboy1985/ssoc-decision-trail): the user
pastes a **business description** (or a MyCareersFuture job link, which loads the posting
company's profile). The app classifies it into an SSIC 2025 5-digit industry code with TypeSafe
Jev and animates **how** the decision was made on the same pixel-art canvas.

## Done =
- `npm start` serves the app on http://localhost:5173; real companies classify end-to-end
- Each level's probabilities animate; finals + probability list + decision log shown
- Results plausible for 8+ varied real companies (recorded in `TEST_RESULTS.md`)
- New public repo `blurboy1985/ssic-decision-trail` on GitHub
- Live at https://ssic.danielquek.com (Cloudflare Worker, same spend protection as SSOC)

## Design (deltas from the SSOC app)
- **Data**: SingStat SSIC 2025 Detailed Definitions + Alphabetical Index + 2020↔2025
  correspondence xlsx (`raw/`) → `data/ssic2025.json` via `tools/build_ssic.py`.
  Levels: Section (A–U) → Division (2) → Group (3) → Class (4) → Sub-class (5).
  Leaves carry definition, examples, cross-references ("classified elsewhere") and alternative
  titles from the alphabetical index.
- **Decision method**: unchanged beam search (width 3) + 5-way finals; the gate question
  becomes "is this a description of a business's activities?".
- **Reference**: MCF postings carry the employer's SSIC (2020) code → mapped to 2025 with
  SingStat's correspondence table; shown for comparison, not ground truth.
- **Avatars**: one costume per SSIC division (2-digit), reusing the SSOC outfit/hat/prop kit.
- **Deploy**: new Worker `ssic-decision-trail`, custom domain `ssic.danielquek.com`, own KV
  namespace for the daily cap, `TYPESAFE_API_KEY` secret.

## Steps
1. Build SSIC JSON — verify counts per level, parents/children consistent
2. Port lib/server/worker to SSIC — verify with curl on a sample description
3. Port canvas UI (labels, levels, costumes, samples) — verify in browser
4. Evaluate 8–10 real MCF companies → `TEST_RESULTS.md`
5. Git init, create GitHub repo, push
6. Deploy to Cloudflare, verify live site end-to-end

## Risks
- Many MCF company descriptions are empty/marketing fluff → samples picked by hand; job text
  is not used (it describes the occupation, not the industry).
- Section-level options list every sub-class title (≈1,000) → large prompt; same trade-off as SSOC.

## Status (2026-10-25)
All 6 steps done. Steps 1–4: see `TEST_RESULTS.md` (10/12 exact vs employer tags, 12/12 reached
finals). Step 5: https://github.com/blurboy1985/ssic-decision-trail (public, like SSOC). Step 6: Worker
`ssic-decision-trail` live at https://ssic.danielquek.com, own KV namespace and rate-limit
namespaces (2403/2404), `TYPESAFE_API_KEY` secret set; live classify + MCF load verified.
Plan changes made during execution:
- MCF's `ssicCode2020` field already holds SSIC 2025 codes → used directly as the reference;
  `ssicCode` (SSIC 2020) is mapped through the correspondence table only as a fallback.
- Sample chips use snapshotted employer profiles (`public/samples.json`) instead of live postings,
  so they survive postings closing.
