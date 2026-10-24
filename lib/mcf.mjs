// Fetch the employer behind a MyCareersFuture posting through MCF's public API: its company
// profile becomes the business description, its own SSIC tag becomes the reference.

const API = "https://api.mycareersfuture.gov.sg/v2/jobs/";

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function htmlToText(html) {
  return String(html || "")
    .replace(/<\s*(br|\/p|\/div|\/h\d|\/ul|\/ol)\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
      if (e[0] === "#") return String.fromCodePoint(parseInt(e.slice(e[1] === "x" ? 2 : 1), e[1] === "x" ? 16 : 10));
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/[ \t ]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

export function jobIdFrom(input) {
  const match = String(input || "").match(/[0-9a-f]{32}/i);
  return match ? match[0].toLowerCase() : null;
}

/**
 * The employer's own SSIC tag. Despite its name, MCF's `ssicCode2020` already holds the SSIC 2025
 * code (e.g. 85402 Universities, 42100, which exist only in 2025), while `ssicCode` is the
 * SSIC 2020 code; without a 2025 code, map the 2020 one with SingStat's correspondence table.
 */
export function referenceFor(company, tree) {
  const ssic2020 = company.ssicCode ? String(company.ssicCode) : null;
  const tagged = company.ssicCode2020 ? String(company.ssicCode2020) : null;
  const codes = tagged && tree.nodes[tagged] ? [tagged] : ssic2020 ? tree.ssic2020to2025[ssic2020] || [] : [];
  if (!codes.length && !ssic2020) return null;
  return {
    ssic2020,
    mapped: !(tagged && tree.nodes[tagged]),
    ssic2025: codes.map((code) => ({ code, title: tree.nodes[code]?.title || "" })),
  };
}

export async function fetchMcfCompany(input, tree) {
  const id = jobIdFrom(input);
  if (!id) throw new Error("That doesn't look like a MyCareersFuture job link (no job id found).");
  const res = await fetch(API + id, { headers: { "User-Agent": "Mozilla/5.0 ssic-decision-trail" } });
  if (!res.ok) throw new Error(`MyCareersFuture returned ${res.status} for job ${id}.`);
  const job = await res.json();
  // Agencies post on behalf of clients; the hiring company is then the business we want.
  const company = job.hiringCompany?.description ? job.hiringCompany : job.postedCompany || {};
  const description = htmlToText(company.description);
  if (description.length < 40) {
    throw new Error(`${company.name || "This employer"} has no company profile on MyCareersFuture. Paste a description of the business instead.`);
  }
  return {
    id,
    name: company.name || "",
    uen: company.uen || "",
    job: job.title,
    url: job.metadata?.jobDetailsUrl || `https://www.mycareersfuture.gov.sg/job/${id}`,
    description,
    reference: referenceFor(company, tree),
  };
}
