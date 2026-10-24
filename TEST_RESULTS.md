# Test results — 2026-10-25

12 real employers from MyCareersFuture (company profiles snapshotted in `public/samples.json`),
run with `node tools/eval.mjs`. "Employer tag" is the SSIC 2025 code on the employer's MCF company
record. It is a **reference, not ground truth**: companies self-declare their SSIC to ACRA.

Model `jev-latest`, beam width 3, 5 finalists. ~1.4 s and ~23k input tokens per business (6 requests).

| Sample | Jev (SSIC 2025) | P | Employer tag | Verdict |
| --- | --- | --- | --- | --- |
| Noodle maker (Hiap Giap) | 10740 Manufacture of macaroni, noodles… | 100% | 10740 | ✓ match |
| Pharma plant (Novartis) | 21012 Manufacture of pharmaceutical products for human use | 95% | 21022 Other biological products | Profile describes the group's medicines, eye care and generics, not the site's biologics; Jev plausible |
| Recycler (New Century) | 38301 Recycling of metal waste and scrap | 89% | 38301 | ✓ match |
| Shipping line (Norden) | 50023 Branches of foreign shipping lines | 68% | 50021 Shipping companies | Same class; profile presents a Danish group's Singapore arm. Ambiguous; lower probability reflects it |
| Heritage hotel (Goodwood Park) | 55101 Hotels | 100% | 55101 | ✓ match |
| BBQ restaurant (Burnt Ends) | 56111 Restaurants | 100% | 56111 | ✓ match |
| Software house (Kuailu) | 62011 Development of software and applications | 74% | 62011 | ✓ match |
| Bank (OCBC) | 64120 Full banks | 98% | 64120 | ✓ match |
| Recruitment firm (Wecruit) | 78104 Employment agencies | 98% | 78104 | ✓ match |
| Security agency (Metropolis) | 80100 Private security activities | 99% | 80100 | ✓ match |
| Cleaning company (HCH) | 81211 General cleaning services | 98% | 81211 | ✓ match |
| University (NTU) | 85402 Universities | 98% | 85402 | ✓ match |

**Exact agreement with employer tag: 10/12. Same 4-digit class: 11/12. Employer's code reached the
finals: 12/12.** Raw output in `samples/eval.json`.

## Data finding
MCF's company field `ssicCode2020` already holds **SSIC 2025** codes (e.g. NTU 85402 = Universities,
and 42100, a code that exists only in 2025); `ssicCode` holds the SSIC 2020 code (NTU 85302). The app
uses `ssicCode2020` as the reference and falls back to mapping `ssicCode` through SingStat's
2020→2025 correspondence table.

## Edge cases (local server)
- Non-business text (a weekend story): "describes a real business" Noul = 2%; the READ scene flags it.
  SSIC has no "unidentifiable" code (SSOC has X1000), so a final code is still produced (93209, 95%).
- Bad link → 400 "no job id found"; employer with no MCF profile → 400 asking for a pasted description;
  too-short text → 400. All shown in the UI status line.
- MCF link for an employer outside the samples (iNova Pharmaceuticals) loads name, profile and tag
  46461 Wholesale of medicinal and pharmaceutical products.

## UI checks (built-in browser, 1400px and 375px)
Idle crowd (division costumes), READ gate, crowd sorting by tier, top-path bars and bubbles, trail
codes, finals podium + crown, result card, employer-tag comparison, decision log, Prev/Next/arrow
keys, sample chips. No console errors; no horizontal scroll at 375px.
`node tools/check_costumes.mjs`: 82 divisions, 82 distinct costumes, all parts exist.
