// Every SSIC 2025 division has a costume, every costume is distinct, every part exists.
// Usage: node tools/check_costumes.mjs
import { readFile } from "node:fs/promises";
import { DIVISION, OUTFITS, HATS, PROPS, EXTRAS } from "../public/costumes.js";

const tree = JSON.parse(await readFile(new URL("../data/ssic2025.json", import.meta.url), "utf8"));
const divisions = Object.values(tree.nodes).filter((n) => n.level === 2).map((n) => n.code);
const problems = [];
for (const code of divisions) if (!DIVISION[code]) problems.push(`no costume for ${code}`);
for (const code of Object.keys(DIVISION)) if (!divisions.includes(code)) problems.push(`costume for unknown division ${code}`);
const seen = new Map();
for (const [code, spec] of Object.entries(DIVISION)) {
  const [outfit, hat, prop, ...extras] = spec.split(/\s+/);
  const [name, colours = ""] = outfit.split("/");
  if (!OUTFITS[name]) problems.push(`${code}: unknown outfit ${name}`);
  else if (/[ab]/.test(OUTFITS[name].rows.join("") + OUTFITS[name].shirt + OUTFITS[name].pants) && !colours) problems.push(`${code}: ${name} needs colours`);
  if (hat !== "-" && !HATS[hat]) problems.push(`${code}: unknown hat ${hat}`);
  if (!PROPS[prop]) problems.push(`${code}: unknown prop ${prop}`);
  for (const x of extras) if (!EXTRAS.includes(x)) problems.push(`${code}: unknown extra ${x}`);
  if (seen.has(spec)) problems.push(`${code} duplicates ${seen.get(spec)}`);
  seen.set(spec, code);
}
console.log(`${divisions.length} divisions, ${Object.keys(DIVISION).length} costumes, ${seen.size} distinct`);
console.log(problems.length ? problems.join("\n") : "all good");
process.exit(problems.length ? 1 : 0);
