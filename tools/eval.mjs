// Run every sample company (public/samples.json) through the classifier and compare with the
// employer's own SSIC tag on MyCareersFuture. Usage: node tools/eval.mjs [--json out.json]

import { readFile, writeFile } from "node:fs/promises";
import { TypeSafeClient } from "@typesafe-ai/sdk";
import { classify } from "../lib/classify.mjs";

const SAMPLES = JSON.parse(await readFile(new URL("../public/samples.json", import.meta.url), "utf8"));
const tree = JSON.parse(await readFile(new URL("../data/ssic2025.json", import.meta.url), "utf8"));
const client = new TypeSafeClient();
const pct = (p) => `${(p * 100).toFixed(0)}%`;

const results = await Promise.all(SAMPLES.map(async (sample) => {
  let first;
  let final;
  for await (const event of classify(client, tree, sample)) {
    if (event.type === "round" && event.round === 1) first = event;
    if (event.type === "final") final = event;
  }
  const expected = (sample.reference?.ssic2025 || []).map((m) => m.code);
  const finalists = final.finalists.map((f) => f.code);
  return {
    label: sample.label, name: sample.name,
    expected: sample.reference?.ssic2025 || [],
    winner: { code: final.winner.code, title: final.winner.title, p: final.winner.p },
    exact: expected.includes(final.winner.code),
    classMatch: expected.some((code) => code.slice(0, 4) === final.winner.code.slice(0, 4)),
    expectedInFinals: expected.some((code) => finalists.includes(code)),
    isBusiness: first.isBusiness,
    level1: first.decisions[0].probs.slice(0, 3).map((p) => `${p.code}:${pct(p.p)}`).join(" "),
    path: final.winner.path.join(">"),
    ms: final.totalMs,
    tokens: final.usage.input_tokens,
  };
}));

for (const r of results) {
  console.log(`${r.exact ? "✓" : r.classMatch ? "~" : "✗"} ${r.label.padEnd(17)} → ${r.winner.code} ${r.winner.title.slice(0, 40).padEnd(40)} ${pct(r.winner.p).padStart(4)} | employer: ${r.expected.map((e) => `${e.code} ${e.title}`).join(" / ").slice(0, 46)} | L1 ${r.level1} | ${r.ms}ms`);
}
const n = results.length;
console.log(`\nexact ${results.filter((r) => r.exact).length}/${n} · same class ${results.filter((r) => r.classMatch).length}/${n} · employer code reached finals ${results.filter((r) => r.expectedInFinals).length}/${n} · avg ${Math.round(results.reduce((a, r) => a + r.ms, 0) / n)} ms · avg ${Math.round(results.reduce((a, r) => a + r.tokens, 0) / n)} input tokens`);
const out = process.argv.indexOf("--json");
if (out > 0) await writeFile(process.argv[out + 1], JSON.stringify(results, null, 2));
