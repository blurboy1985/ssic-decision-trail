// Snapshot the sample companies' MyCareersFuture profiles into public/samples.json, so the sample
// chips keep working after the job postings close. Usage: node tools/snapshot_samples.mjs
// samples/mcf_samples.txt lines: <chip label> | <MCF job id>

import { readFile, writeFile } from "node:fs/promises";
import { fetchMcfCompany } from "../lib/mcf.mjs";

const lines = (await readFile(new URL("../samples/mcf_samples.txt", import.meta.url), "utf8"))
  .trim().split("\n").map((line) => line.split(" | ").map((s) => s.trim()));
const tree = JSON.parse(await readFile(new URL("../data/ssic2025.json", import.meta.url), "utf8"));

const samples = [];
for (const [label, id] of lines) {
  try {
    const c = await fetchMcfCompany(id, tree);
    samples.push({ label, name: c.name, url: c.url, description: c.description, reference: c.reference });
    console.log(`✓ ${label.padEnd(18)} ${c.name} (${c.description.length} chars, SSIC 2025 tag ${c.reference?.ssic2025.map((m) => m.code).join("/") || "-"})`);
  } catch (err) {
    console.log(`✗ ${label}: ${err.message}`);
  }
}
await writeFile(new URL("../public/samples.json", import.meta.url), JSON.stringify(samples, null, 1));
console.log(`${samples.length} samples written to public/samples.json`);
